import ffmpeg
import io
import os
import numpy as np
import sys
import tempfile
import time
import datetime
from flask import Flask, request, jsonify, send_from_directory, send_file, Response
from flask_cors import CORS
from scipy.io import wavfile
from transformers import pipeline
import whisper # type: ignore
import logging
import pymongo
from gridfs import GridFS
from bson.objectid import ObjectId
from functools import wraps
import json
import urllib.request
from jose import jwt, JWTError
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("server.log")
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static')

# MongoDB setup - moved to top of file
load_dotenv()  # Load environment variables from .env file
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI environment variable is not set")
    
DB_NAME = os.getenv('DB_NAME')
if not DB_NAME:
    raise RuntimeError("DB_NAME environment variable is not set")

mongo_client = pymongo.MongoClient(MONGODB_URI)
db = mongo_client[DB_NAME]
collection = db['recordings']

# Initialize GridFS for storing audio files
fs = GridFS(db, collection='audio_files')

# Initialize CORS to allow requests from localhost for development and production domain
allowed_origins = [
    "http://localhost:3000", 
    "http://localhost:5000", 
    "http://127.0.0.1:3000", 
    "http://127.0.0.1:5000",
    # Add your Azure VM domain/IP here
    os.getenv("FRONTEND_URL", "http://localhost:3000")  # Get from environment variable or default to localhost
]
CORS(app, resources={r"/*": {"origins": allowed_origins, "supports_credentials": True}})

# Load Whisper model
whisper_model_size = os.environ.get("WHISPER_MODEL_SIZE", "small")
try:
    whisper_model = whisper.load_model(whisper_model_size)
except Exception as e:
    raise RuntimeError(f"Failed to load Whisper model: {e}")

# Load emotion detection pipeline
emotion_detector = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")

def detect_filler_words(text):
    """Detect filler words in the transcription text."""
    # Common filler words and phrases - expanded to catch variations
    filler_words = {
        'um': 'hesitation',
        'uhm': 'hesitation',
        'umm': 'hesitation',
        'uh': 'hesitation',
        'uhh': 'hesitation',
        'er': 'hesitation',
        'err': 'hesitation',
        'ah': 'hesitation',
        'ahh': 'hesitation',
        'hmm': 'hesitation', 
        'like': 'comparison',
        'you know': 'verbal crutch',
        'i mean': 'verbal crutch',
        'actually': 'verbal crutch',
        'basically': 'verbal crutch',
        'literally': 'verbal crutch',
        'honestly': 'verbal crutch',
        'so': 'transition',
        'right': 'confirmation',
        'kind of': 'hedging',
        'sort of': 'hedging',
    }
    
    results = {"total_count": 0, "categories": {}, "instances": []}
    
    # Normalize text for better matching (lowercase)
    normalized_text = text.lower()
    words = normalized_text.split()
      # Process for single-word fillers
    for i, word in enumerate(words):
        # Check exact matches
        if word in filler_words:
            category = filler_words[word]
            results["total_count"] += 1
            
            # Track categories
            if category not in results["categories"]:
                results["categories"][category] = 1
            else:
                results["categories"][category] += 1
                
            # Track instances with context
            start_idx = max(0, i - 3)  # up to 3 words before
            end_idx = min(len(words), i + 4)  # up to 3 words after
            context = ' '.join(words[start_idx:end_idx])
            
            results["instances"].append({
                "word": word,
                "category": category,
                "context": context
            })
        # Additional check for words containing fillers (like 'umm' or 'uhh')
        else:
            for filler in ['um', 'uh', 'er', 'ah']:
                if filler in word or word.startswith(filler) or word.endswith(filler):
                    category = filler_words.get(filler, 'hesitation')
                    results["total_count"] += 1
                    
                    # Track categories
                    if category not in results["categories"]:
                        results["categories"][category] = 1
                    else:
                        results["categories"][category] += 1
                    
                    # Track instances with context
                    start_idx = max(0, i - 3)
                    end_idx = min(len(words), i + 4)
                    context = ' '.join(words[start_idx:end_idx])
                    
                    results["instances"].append({
                        "word": word,
                        "category": category,
                        "context": context
                    })
                    break
    
    # Process for multi-word fillers
    for phrase in [fw for fw in filler_words.keys() if ' ' in fw]:
        if phrase in normalized_text:
            category = filler_words[phrase]
            count = normalized_text.count(phrase)
            results["total_count"] += count
            
            # Track categories
            if category not in results["categories"]:
                results["categories"][category] = count
            else:
                results["categories"][category] += count
                
            # Find all occurrences
            start_pos = 0
            while True:
                start_pos = normalized_text.find(phrase, start_pos)
                if start_pos == -1:
                    break
                    
                # Get context
                context_start = normalized_text.rfind(' ', 0, max(0, start_pos - 15))
                if context_start == -1:
                    context_start = 0
                context_end = normalized_text.find(' ', min(len(normalized_text), start_pos + len(phrase) + 15))
                if context_end == -1:
                    context_end = len(normalized_text)
                
                context = normalized_text[context_start:context_end].strip()
                
                results["instances"].append({
                    "word": phrase,
                    "category": category,
                    "context": context
                })
                
                start_pos += len(phrase)
    
    # Calculate frequency per minute (assuming average speaking rate of 150 words per minute)
    word_count = len(words)
    estimated_duration_minutes = word_count / 150
    
    if estimated_duration_minutes > 0:
        results["frequency_per_minute"] = results["total_count"] / estimated_duration_minutes
    else:
        results["frequency_per_minute"] = 0
        
    return results

def perform_emotion_detection(text):
    """Perform emotion detection on the given text."""
    emotion_result = emotion_detector(text)
    emotion = max(emotion_result, key=lambda x: x['score'])['label']
    emotion_score = max(emotion_result, key=lambda x: x['score'])['score']
    return {
        "emotion": emotion,
        "emotion_score": emotion_score
    }

# Function to calculate confidence score based on audio properties using numpy and scipy
def calculate_confidence_from_audio(audio_data):
    """Calculate confidence score based on audio properties."""
    # Read WAV data
    sample_rate, samples = wavfile.read(io.BytesIO(audio_data))

    # Calculate loudness (RMS)
    rms = np.sqrt(np.mean(samples**2))
    loudness = 20 * np.log10(rms) if rms > 0 else -float('inf')

    # Detect nonsilent ranges manually
    threshold = np.max(samples) * 0.02  # Set a threshold for silence
    nonsilent_samples = samples[np.abs(samples) > threshold]
    speech_duration = len(nonsilent_samples) / sample_rate  # in seconds
    total_duration = len(samples) / sample_rate  # in seconds

    # Calculate speech-to-total duration ratio
    speech_ratio = speech_duration / total_duration if total_duration > 0 else 0

    # Combine factors to calculate confidence score
    confidence_score = max(50, min(100, (loudness + 40) * 0.5 + speech_ratio * 50))
    return round(confidence_score)

def detect_speech_pauses(audio_data):
    """Detect pauses in speech from audio data."""
    try:
        # Read WAV data
        sample_rate, samples = wavfile.read(io.BytesIO(audio_data))

        # Convert to mono if stereo
        if len(samples.shape) > 1:
            samples = np.mean(samples, axis=1)

        # Normalize audio samples
        samples = samples / np.max(np.abs(samples))

        # Calculate RMS energy in small windows
        window_size = int(0.05 * sample_rate)  # 50ms windows
        step_size = int(0.025 * sample_rate)   # 25ms step (50% overlap)

        energy_windows = []
        for i in range(0, len(samples) - window_size, step_size):
            window = samples[i:i + window_size]
            energy = np.sqrt(np.mean(window**2))
            energy_windows.append(energy)

        energy_windows = np.array(energy_windows)

        # Adaptive threshold for silence
        silence_threshold = np.percentile(energy_windows, 20)  # Bottom 20% considered silence

        # Detect silence segments
        is_silence = energy_windows < silence_threshold

        # Convert to time segments
        time_per_window = step_size / sample_rate

        # Group consecutive silence windows
        silence_segments = []
        in_silence = False
        silence_start = 0

        for i, silent in enumerate(is_silence):
            if silent and not in_silence:
                in_silence = True
                silence_start = i * time_per_window
            elif not silent and in_silence:
                in_silence = False
                silence_duration = i * time_per_window - silence_start
                if silence_duration > 0.3:  # Only count pauses longer than 0.3 seconds
                    silence_segments.append({
                        "start": silence_start,
                        "end": i * time_per_window,
                        "duration": silence_duration
                    })

        # Handle case where audio ends during silence
        if in_silence:
            silence_duration = len(is_silence) * time_per_window - silence_start
            if silence_duration > 0.3:
                silence_segments.append({
                    "start": silence_start,
                    "end": len(is_silence) * time_per_window,
                    "duration": silence_duration
                })

        # Calculate total duration of speech and silence
        total_duration = len(samples) / sample_rate
        silence_duration = sum(segment["duration"] for segment in silence_segments)
        speech_duration = total_duration - silence_duration

        return {
            "total_pauses": len(silence_segments),
            "pause_segments": silence_segments,
            "speaking_time": speech_duration,
            "silence_time": silence_duration,
            "total_duration": total_duration,
            "pause_percentage": (silence_duration / total_duration) * 100 if total_duration > 0 else 0
        }
    except Exception as e:
        return {
            "total_pauses": 0,
            "pause_segments": [],
            "speaking_time": 0,
            "silence_time": 0,
            "total_duration": 0,
            "pause_percentage": 0,
            "error": str(e)
        }

def transcribe_with_whisper(audio_data):
    """Transcribe audio using Whisper."""
    try:
        # Create a temporary file for the audio
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
            temp_path = temp_wav.name
            temp_wav.write(audio_data)
        
        start_time = time.time()        # Use Whisper to transcribe
        # Note: Whisper sometimes cleans up filler words by default
        result = whisper_model.transcribe(
            temp_path,
            language="en",  # Force English
            word_timestamps=True,  # Get timestamps for word-level analysis
            fp16=False,  # Use fp32 for CPU compatibility
            verbose=True,  # Enable verbose output for more information
            prepend_punctuations=",.?!:;\"'""''…—–()",
            append_punctuations=",.?!:;\"'""''…—–()",
            suppress_blank=False  # Don't suppress blank outputs which might contain fillers
        )
        transcription_time = time.time() - start_time
        
        # Clean up temporary file
        try:
            os.unlink(temp_path)
        except Exception as e:
            pass
        
        return result
    except Exception as e:
        raise

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files['audio']
        webm_data = audio_file.read()

        # Convert WebM to WAV in memory
        process = (
            ffmpeg
            .input('pipe:0', format='webm')
            .output('pipe:1', format='wav', acodec='pcm_s16le', ac=1, ar='16000')
            .run_async(pipe_stdin=True, pipe_stdout=True, pipe_stderr=True)
        )
        wav_data, _ = process.communicate(input=webm_data)

        # Calculate confidence score from audio
        confidence_score = calculate_confidence_from_audio(wav_data)

        # Detect speech pauses
        pause_analysis = detect_speech_pauses(wav_data)

        # Transcribe with Whisper
        whisper_result = transcribe_with_whisper(wav_data)
        transcription = whisper_result['text']

        # Perform emotion detection
        emotion_analysis = perform_emotion_detection(transcription)

        # Perform filler word detection
        filler_word_analysis = detect_filler_words(transcription)

        # Prepare response
        response_data = {
            "transcription": transcription,
            "confidence_score": confidence_score,
            "emotion": emotion_analysis["emotion"],
            "emotion_score": emotion_analysis["emotion_score"],
            "filler_words": filler_word_analysis,
            "transcription_source": "whisper",
            "pauses": pause_analysis,  # Include pause analysis in the response
            "speech_pauses": {  # Additional formatted data for frontend
                "total": pause_analysis["total_pauses"],
                "speaking_time": round(pause_analysis["speaking_time"], 2),
                "silence_time": round(pause_analysis["silence_time"], 2),
                "total_duration": round(pause_analysis["total_duration"], 2),
                "pause_percentage": round(pause_analysis["pause_percentage"], 1)
            }
        }

        # Get storage preference from query parameters
        storage_preference = request.args.get('storage')
        logger.info(f"Storage preference received: {storage_preference}")
        
        # Make sure we explicitly handle all cases
        if storage_preference is None:
            # Default if not specified
            storage_preference = 'local'
            logger.info("No storage preference specified, using default: local")
        
        # Save recording only if:
        # 1. Storage preference is 'session' or 'none' (not 'local') OR
        # 2. Save is explicitly requested via 'save=true' parameter
        # AND user is authenticated
        save_recording = False
        
        if request.headers.get('Authorization'):
            if storage_preference != 'local':
                save_recording = True
                logger.info(f"Saving recording because storage preference is {storage_preference}")
            elif request.args.get('save') == 'true':
                save_recording = True
                logger.info("Saving recording because save=true parameter is present")
            else:
                logger.info(f"Not saving recording. Storage preference: {storage_preference}, Save param: {request.args.get('save')}")
        else:
            logger.info("Not saving recording because user is not authenticated")
        
        if save_recording:
            try:
                # Validate token from Auth0
                auth_header = request.headers.get('Authorization')
                token = auth_header.split()[1]
                
                # Get public key from Auth0
                from urllib.request import urlopen
                import json
                AUTH0_DOMAIN = os.getenv('REACT_APP_AUTH0_DOMAIN')
                API_IDENTIFIER = os.getenv('REACT_APP_AUTH0_API_AUDIENCE')
                ALGORITHMS = ['RS256']
                
                jwks_url = f'https://{AUTH0_DOMAIN}/.well-known/jwks.json'
                jwks = json.loads(urlopen(jwks_url).read())
                
                unverified_header = jwt.get_unverified_header(token)
                rsa_key = {}
                for key in jwks['keys']:
                    if key['kid'] == unverified_header['kid']:
                        rsa_key = {
                            'kty': key['kty'],
                            'kid': key['kid'],
                            'use': key['use'],
                            'n': key['n'],
                            'e': key['e']
                        }
                
                if rsa_key:
                    # Decode token
                    payload = jwt.decode(
                        token,
                        rsa_key,
                        algorithms=ALGORITHMS,
                        audience=API_IDENTIFIER,
                        issuer=f'https://{AUTH0_DOMAIN}/'
                    )
                    user_id = payload['sub']
                else:
                    # If no valid key found, use token as user ID (not secure but fallback)
                    user_id = token
            except Exception:
                # Fallback to using token as user ID
                user_id = request.headers.get('Authorization').split(' ')[1] if request.headers.get('Authorization') else 'anonymous'
            
            # Create a record to save
            # Get title and notes from either JSON or form data
            # First try to get from JSON data (if it exists)
            json_data = request.get_json(silent=True) or {}
            # Then try form data as fallback
            title = json_data.get('title') or request.form.get('title') or f"Recording {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
            notes = json_data.get('notes') or request.form.get('notes') or ''
            
            recording_data = {
                "transcription": transcription,
                "confidence_score": confidence_score,
                "emotion": emotion_analysis["emotion"],
                "emotion_score": emotion_analysis["emotion_score"],
                "filler_words": filler_word_analysis,
                "pauses": pause_analysis["total_pauses"],
                "speaking_time": round(pause_analysis["speaking_time"], 2),
                "silence_time": round(pause_analysis["silence_time"], 2),
                "pause_percentage": round(pause_analysis["pause_percentage"], 1),
                "title": title,
                "notes": notes
            }
            
            # Check if user has reached 10 recordings limit
            user_recordings_count = collection.count_documents({'userId': user_id})
            if user_recordings_count >= 10:
                # Find and delete the oldest recording for this user
                oldest_recording = collection.find_one(
                    {'userId': user_id},
                    sort=[('timestamp', pymongo.ASCENDING)]
                )
                if oldest_recording:
                    # Delete associated audio file if it exists
                    if 'audio_id' in oldest_recording:
                        try:
                            fs.delete(ObjectId(oldest_recording['audio_id']))
                        except Exception as e:
                            logger.warning(f"Could not delete old audio file: {str(e)}")
                    
                    # Delete the recording document
                    collection.delete_one({'_id': oldest_recording['_id']})
                    response_data["oldest_recording_deleted"] = str(oldest_recording['_id'])
            
            # Store the audio in GridFS
            audio_id = fs.put(
                wav_data, 
                filename=f"recording_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}.wav",
                content_type="audio/wav",
                userId=user_id
            )
            
            # Save new recording to MongoDB with audio file reference
            doc = {
                **recording_data, 
                'userId': user_id, 
                'timestamp': datetime.datetime.utcnow(),
                'audio_id': str(audio_id)  # Store reference to the audio file
            }
            result = collection.insert_one(doc)
            response_data["saved"] = True
            response_data["recording_id"] = str(result.inserted_id)
            response_data["audio_id"] = str(audio_id)

        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Error in /transcribe endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

# MongoDB setup already defined at the top of the file

# Auth0 JWT validation
def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header:
            return jsonify({'error': 'Authorization header missing'}), 401
        parts = auth_header.split()
        if parts[0].lower() != 'bearer' or len(parts) != 2:
            return jsonify({'error': 'Invalid Authorization header'}), 401
        token = parts[1]
        
        try:
            # Get public key from Auth0
            AUTH0_DOMAIN = os.getenv('REACT_APP_AUTH0_DOMAIN')
            API_IDENTIFIER = os.getenv('REACT_APP_AUTH0_API_AUDIENCE')
            
            if not AUTH0_DOMAIN:
                return jsonify({'error': 'AUTH0_DOMAIN environment variable not set'}), 500
            if not API_IDENTIFIER:
                return jsonify({'error': 'AUTH0_API_AUDIENCE environment variable not set'}), 500
                
            ALGORITHMS = ['RS256']
            
            jwks_url = f'https://{AUTH0_DOMAIN}/.well-known/jwks.json'
            try:
                jwks = json.loads(urllib.request.urlopen(jwks_url).read())
            except Exception as e:
                return jsonify({'error': f'Failed to fetch Auth0 JWKS: {str(e)}'}), 500
            
            unverified_header = jwt.get_unverified_header(token)
            rsa_key = {}
            for key in jwks['keys']:
                if key['kid'] == unverified_header['kid']:
                    rsa_key = {
                        'kty': key['kty'],
                        'kid': key['kid'],
                        'use': key['use'],
                        'n': key['n'],
                        'e': key['e']
                    }
            
            if not rsa_key:
                return jsonify({'error': 'Appropriate key not found'}), 401
                
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=ALGORITHMS,
                audience=API_IDENTIFIER,
                issuer=f'https://{AUTH0_DOMAIN}/'
            )
            
            request.user = payload
            return f(*args, **kwargs)
            
        except JWTError as e:
            logger.warning(f"JWT validation error: {str(e)}")
            return jsonify({'error': 'Invalid token', 'details': str(e)}), 401
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}", exc_info=True)
            return jsonify({'error': 'Token validation error', 'details': str(e)}), 401
    return decorated

# Implement logic for fetching recordings
@app.route('/api/recordings', methods=['GET'])
@requires_auth
def get_recordings():
    user_id = request.user['sub']  # Get user ID from the validated token
    recordings = list(collection.find({'userId': user_id}).sort('timestamp', -1))
    
    # Process each recording to add audio URL and convert ObjectIDs to strings
    base_url = request.url_root.rstrip('/')
    for r in recordings:
        r['_id'] = str(r['_id'])
        
        # Add audio URL if audio_id exists
        if 'audio_id' in r:
            audio_id = r['audio_id']
            r['audio_url'] = f"{base_url}/api/audio/{audio_id}"
    
    return jsonify(recordings)

# Implement logic for creating a new recording
@app.route('/api/recordings', methods=['POST'])
@requires_auth
def create_recording():
    user_id = request.user['sub']  # Get user ID from the validated token
    recording = request.json
    doc = {**recording, 'userId': user_id, 'timestamp': datetime.datetime.utcnow()}
    result = collection.insert_one(doc)
    return jsonify({'_id': str(result.inserted_id)})

# Implement logic for updating a recording
@app.route('/api/recordings/<recording_id>', methods=['PUT'])
@requires_auth
def update_recording(recording_id):
    user_id = request.user['sub']  # Get user ID from the validated token
    updates = request.json
    result = collection.update_one({'_id': pymongo.ObjectId(recording_id), 'userId': user_id}, {'$set': updates})
    return jsonify({'modified_count': result.modified_count})

# Implement logic for deleting a recording
@app.route('/api/recordings/<recording_id>', methods=['DELETE'])
@requires_auth
def delete_recording(recording_id):
    user_id = request.user['sub']  # Get user ID from the validated token
    
    # First get the recording to find the associated audio file
    recording = collection.find_one({'_id': ObjectId(recording_id), 'userId': user_id})
    
    if recording and 'audio_id' in recording:
        try:
            # Delete the audio file from GridFS
            fs.delete(ObjectId(recording['audio_id']))
        except Exception as e:
            logger.error(f"Error deleting audio file: {str(e)}", exc_info=True)
    
    # Delete the recording document
    result = collection.delete_one({'_id': ObjectId(recording_id), 'userId': user_id})
    return jsonify({'deleted_count': result.deleted_count})

# Endpoint to retrieve audio files from GridFS
@app.route('/api/audio/<audio_id>', methods=['GET'])
def get_audio(audio_id):
    try:
        # Retrieve the file from GridFS
        audio_file = fs.get(ObjectId(audio_id))
        
        # Create a response with the audio data
        response = Response(audio_file.read(), mimetype='audio/wav')
        
        # Set headers to help browsers handle the file correctly
        response.headers['Content-Disposition'] = f'inline; filename={audio_file.filename}'
        response.headers['Accept-Ranges'] = 'bytes'
        
        return response
    except Exception as e:
        logger.error(f"Error retrieving audio file: {str(e)}", exc_info=True)
        return jsonify({"error": "Audio file not found", "details": str(e)}), 404

from waitress import serve

def validate_environment_variables():
    """Validate all required environment variables are set"""
    required_vars = [
        'MONGODB_URI', 
        'DB_NAME', 
        'REACT_APP_AUTH0_DOMAIN', 
        'REACT_APP_AUTH0_API_AUDIENCE'
    ]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        logger.error(f"Missing required environment variables: {', '.join(missing)}")
        return False
    return True

if __name__ == '__main__':
    # Validate environment variables
    if not validate_environment_variables():
        logger.error("Cannot start server due to missing environment variables")
        sys.exit(1)
        
    logger.info("Starting server with waitress on 0.0.0.0:5000")
    # Set timeout to 5 minutes (300 seconds)
    serve(app, host='0.0.0.0', port=5000, threads=4)