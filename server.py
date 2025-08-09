import ffmpeg
import io
import os
import numpy as np
import logging
import sys
import tempfile
import time
from flask import Flask, request, jsonify, send_from_directory, render_template, redirect, url_for
from flask_cors import CORS
from scipy.io import wavfile
from transformers import pipeline
import whisper # type: ignore
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import webrtcvad
import wave
import parselmouth
import soundfile as sf

# Configure logging to also output to the terminal
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),  # Output logs to the terminal
        logging.FileHandler("server.log")  # Optionally log to a file
    ]
)
# Ensure terminal output is enabled by default
logging.getLogger().addHandler(logging.StreamHandler(sys.stdout))

app = Flask(__name__, static_folder='static')
app.secret_key = 'your_secret_key'

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'  # Redirects to this view if not logged in


# MongoDB setup
from pymongo import MongoClient
from dotenv import load_dotenv
load_dotenv()
import os

# Get MongoDB URI and DB name from environment variables
mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
db_name = os.getenv('DB_NAME')
mongo_client = MongoClient(mongo_uri)
db = mongo_client[db_name]
users_collection = db['users']

# User class for Flask-Login
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin):
    def __init__(self, id, password_hash=None):
        self.id = id
        self.password_hash = password_hash
    def check_password(self, password):
        if self.password_hash:
            return check_password_hash(self.password_hash, password)
        return False

# User loader callback
@login_manager.user_loader
def load_user(user_id):
    user_data = users_collection.find_one({'_id': user_id})
    if user_data:
        return User(user_data['_id'], user_data.get('password_hash'))
    return None

# Initialize CORS to allow requests from localhost for development
allowed_origins = ["http://localhost:3000", "http://localhost:5000", "http://127.0.0.1:3000", "http://127.0.0.1:5000"]
CORS(app, resources={r"/*": {"origins": allowed_origins}})
logging.info(f"CORS has been configured to accept requests from: {allowed_origins}")

# Load Whisper model
whisper_model_size = os.environ.get("WHISPER_MODEL_SIZE", "small")
logging.info(f"Loading Whisper model: {whisper_model_size}")
try:
    whisper_model = whisper.load_model(whisper_model_size)
    logging.info(f"Whisper model loaded successfully")
except Exception as e:
    logging.error(f"Error loading Whisper model: {e}")
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
    
    logging.info(f"Looking for filler words in text of length: {len(text)}")
    
    results = {"total_count": 0, "categories": {}, "instances": []}
    
    # Normalize text for better matching (lowercase)
    normalized_text = text.lower()
    words = normalized_text.split()
      # Process for single-word fillers
    for i, word in enumerate(words):
        logging.debug(f"Checking word '{word}' for filler")
        # Check exact matches
        if word in filler_words:
            category = filler_words[word]
            results["total_count"] += 1
            logging.info(f"Detected filler word: '{word}' as {category}")
            
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
                    logging.info(f"Detected partial filler match: '{word}' containing '{filler}' as {category}")
                    
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
    return round(confidence_score, 1)

def analyze_pitch(audio_data, sample_rate=16000):
    """Extracting pitch contour and pitch variation metrics using parselmouth"""
    import scipy.signal

    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
        sf.write(temp_wav, np.frombuffer(audio_data, dtype=np.int16), sample_rate)
        temp_path = temp_wav.name

    try:
        snd = parselmouth.Sound(temp_path)
        pitch = snd.to_pitch(time_step=0.01, pitch_floor=60, pitch_ceiling=500)
        pitch_values = pitch.selected_array['frequency']
        times = pitch.xs()

        smoothed = scipy.signal.medfilt(pitch_values, kernel_size = 5)
        #Filtering the 0Hz values for the statistics (else statement is so that there's no NaN values
        voiced = smoothed[(smoothed > 75) & (smoothed < 450)]

        if len(voiced) > 10:
            voiced_sorted = np.sort(voiced)

            #Separating the outliers here
            pitch_5th = voiced_sorted[int(len(voiced_sorted) * 0.05)]
            pitch_95th = voiced_sorted[int(len(voiced_sorted) * 0.95)]

            mean_pitch = float(np.mean(voiced_sorted))
            std_pitch = float(np.std(voiced_sorted))

            pitch_range = float(pitch_95th - pitch_5th)
            
            #Now this here, is what we call. NORMALIZED RAAAANGEEEE
            expressiveness = (float(pitch_range / mean_pitch))/20

        return {
            "times": times.tolist(),
            "pitch_values": pitch_values.tolist(),
            "mean_pitch": mean_pitch,
            "std_pitch": std_pitch,
            "expressiveness": expressiveness
        }
    finally:
        os.unlink(temp_path)

def detect_speech_pauses_webrtcvad(audio_data, sample_rate=16000, frame_duration_ms=30, aggressiveness=2):
    """Detecting pauses in speech using the webrtcvad library (improved VAD detection)."""
    vad=webrtcvad.Vad(aggressiveness)
    with wave.open(io.BytesIO(audio_data), 'rb') as wf:
        assert wf.getnchannels() == 1
        assert wf.getsampwidth() == 2
        assert wf.getframerate() == sample_rate
        pcm_data = wf.readframes(wf.getnframes())

    frame_size = int(sample_rate * frame_duration_ms / 1000) * 2
    frames = [pcm_data[i:i+frame_size] for i in range(0, len(pcm_data), frame_size)]

    speech_flags = [vad.is_speech(frame, sample_rate) for frame in frames if len(frame) == frame_size]

    # Speech and silence segments found here
    segments = []
    start = None
    for i, is_speech in enumerate(speech_flags):
        t = i * frame_duration_ms / 1000.0
        if is_speech and start is None:
            start = t
        elif not is_speech and start is not None:
            segments.append((start, t))
            start = None
    if start is not None:
        segments.append((start, len(speech_flags) * frame_duration_ms / 1000.0))

    #Calculating pauses represented as the gaps between speech segments
    pauses = []
    last_end = 0.0
    for seg_start, seg_end in segments:
        if seg_start > last_end:
            pauses.append((last_end, seg_start))
        last_end = seg_end

    total_pauses = len(pauses)
    total_pause_duration = sum(end - start for start, end in pauses)
    total_speech_duration = sum(end - start for start, end in segments)
    total_duration = total_speech_duration + total_pause_duration

    return {
        "total_pauses": total_pauses,
        "pause_segments": [{"start": start, "end": end, "duration": end-start} for start, end in pauses],
        "speaking_time": total_speech_duration,
        "silence_time": total_pause_duration,
        "total_duration": total_duration,
        "pause_percentage": (total_pause_duration / total_duration * 100) if total_duration > 0 else 0 
    }


def transcribe_with_whisper(audio_data):
    """Transcribe audio using Whisper."""
    try:
        # Create a temporary file for the audio
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
            temp_path = temp_wav.name
            temp_wav.write(audio_data)
        
        logging.info(f"Transcribing with Whisper using temporary file: {temp_path}")
        
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

        # Avg log probability (using as confidence score)
        avg_logprob = result.get('avg_logprob', None)
        # Whisper logprobs are -ve, the closer it is to 0, the better
        #-1.0 = 60, 0 = 100
        if avg_logprob is None and result['segments']:
            avg_logprob = sum(seg.get('avg_logprob', 0) for seg in result['segments']) / len(result['segments'])
        if avg_logprob is None:
            avg_logprob = -1.0
        confidence_score = max(60, min(100, 100 + avg_logprob * 40))
        confidence_score = round(confidence_score, 1)

        transcription_time = time.time() - start_time
        logging.info(f"Whisper transcription completed in {transcription_time:.2f} seconds")
        
        # Clean up temporary file
        try:
            os.unlink(temp_path)
        except Exception as e:
            logging.warning(f"Failed to delete temporary file {temp_path}: {e}")
        
        return result, confidence_score
    except Exception as e:
        logging.error(f"Error in Whisper transcription: {e}")
        raise

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        logging.info("Received a transcription request.")
        if 'audio' not in request.files:
            logging.warning("No audio file provided in the request.")
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files['audio']
        webm_data = audio_file.read()

        # Convert WebM to WAV in memory
        logging.info("Converting WebM to WAV in memory...")
        process = (
            ffmpeg
            .input('pipe:0', format='webm')
            .output('pipe:1', format='wav', acodec='pcm_s16le', ac=1, ar='16000')
            .run_async(pipe_stdin=True, pipe_stdout=True, pipe_stderr=True)
        )
        wav_data, _ = process.communicate(input=webm_data)

        #Analyze pitch
        pitch_analysis = analyze_pitch(wav_data)

        # Detect speech pauses
        pause_analysis = detect_speech_pauses_webrtcvad(wav_data)
        logging.info(f"Pause analysis: {pause_analysis['total_pauses']} total pauses")

        # Transcribe with Whisper
        whisper_result, confidence_score = transcribe_with_whisper(wav_data)
        transcription = whisper_result['text']
        logging.info(f"Whisper transcription: {transcription}")

        # Perform emotion detection
        emotion_analysis = perform_emotion_detection(transcription)

        # Perform filler word detection
        filler_word_analysis = detect_filler_words(transcription)

        logging.info("Transcription and analysis completed successfully.")

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
            },
            "pitch": pitch_analysis
        }

        return jsonify(response_data)

    except Exception as e:
        logging.error(f"Error during transcription: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500



# Login route: only authenticates existing users
@app.route('/login', methods=['POST'])
def login():
    if request.is_json:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
    else:
        email = request.form.get('email')
        password = request.form.get('password')
    if not email or not password:
        return jsonify({'success': False, 'error': 'Missing email or password'}), 400
    user_data = users_collection.find_one({'_id': email})
    if not user_data:
        return jsonify({'success': False, 'error': "Email isn't registered"}), 404
    user = User(user_data['_id'], user_data.get('password_hash'))
    if user.check_password(password):
        login_user(user)
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'error': 'Incorrect email or password'}), 401

# Signup route: registers new users with email as _id, and optional username
@app.route('/signup', methods=['POST'])
def signup():
    if request.is_json:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        username = data.get('username')
    else:
        email = request.form.get('email')
        password = request.form.get('password')
        username = request.form.get('username')
    if not email or not password:
        return jsonify({'success': False, 'error': 'Missing email or password'}), 400
    user_data = users_collection.find_one({'_id': email})
    if user_data:
        return jsonify({'success': False, 'error': 'Email already exists'}), 409
    password_hash = generate_password_hash(password)
    user_doc = {'_id': email, 'password_hash': password_hash}
    if username:
        user_doc['username'] = username
    users_collection.insert_one(user_doc)
    user = User(email, password_hash)
    login_user(user)
    return jsonify({'success': True, 'message': 'Registration successful'})

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/protected')
@login_required
def protected():
    return f'Hello, {current_user.id}! This is a protected page.'

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/user-info')
def user_info():
    email = request.args.get('email')
    if not email:
        return jsonify({'error': 'Missing email'}), 400
    user_data = users_collection.find_one({'_id': email})
    if not user_data:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'username': user_data.get('username', '')})

from waitress import serve

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
    #print("Starting server with Waitress...")
    # Set timeout to 5 minutes (300 seconds)
    #serve(app, host='0.0.0.0', port=5000, threads=4, debug=True)