import ffmpeg
import io
import os
import numpy as np
import logging
import sys
import tempfile
import time
from flask import Flask, request, jsonify, send_from_directory
from scipy.io import wavfile
from transformers import pipeline
import whisper # type: ignore

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

# Load Whisper model
whisper_model_size = os.environ.get("WHISPER_MODEL_SIZE", "base")
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

def transcribe_with_whisper(audio_data):
    """Transcribe audio using Whisper."""
    try:
        # Create a temporary file for the audio
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
            temp_path = temp_wav.name
            temp_wav.write(audio_data)
        
        logging.info(f"Transcribing with Whisper using temporary file: {temp_path}")
        
        start_time = time.time()
        # Use Whisper to transcribe
        result = whisper_model.transcribe(
            temp_path,
            language="en",  # Force English
            word_timestamps=True,  # Get timestamps for word-level analysis
            fp16=False,  # Use fp32 for CPU compatibility
            verbose=True  # Enable verbose output for more information
        )
        transcription_time = time.time() - start_time
        logging.info(f"Whisper transcription completed in {transcription_time:.2f} seconds")
        
        # Clean up temporary file
        try:
            os.unlink(temp_path)
        except Exception as e:
            logging.warning(f"Failed to delete temporary file {temp_path}: {e}")
        
        return result
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

        # Calculate confidence score from audio
        confidence_score = calculate_confidence_from_audio(wav_data)

        # Transcribe with Whisper
        whisper_result = transcribe_with_whisper(wav_data)        # Extract the transcribed text
        transcription = whisper_result['text']
        logging.info(f"Whisper transcription: {transcription}")

        # Check for segments that might contain filler words
        if 'segments' in whisper_result:
            segment_texts = []
            for segment in whisper_result['segments']:
                if 'text' in segment:
                    segment_texts.append(segment['text'])
            
            # Combine all segments text with the main transcription for a more comprehensive analysis
            combined_text = transcription + " " + " ".join(segment_texts)
            logging.info(f"Combined text for analysis: '{combined_text}'")
        else:
            combined_text = transcription
            
        # Perform emotion detection
        emotion_analysis = perform_emotion_detection(transcription)
        
        # Perform filler word detection with detailed logging
        logging.info(f"Starting filler word detection on text: '{combined_text}'")
        normalized_text = combined_text.lower()
        logging.info(f"Normalized text for filler detection: '{normalized_text}'")
        filler_word_analysis = detect_filler_words(combined_text)
        logging.info(f"Filler word analysis result: {filler_word_analysis}")
        
        logging.info("Transcription and analysis completed successfully.")
        
        # Prepare response
        response_data = {
            "transcription": transcription,
            "confidence_score": confidence_score,
            "emotion": emotion_analysis["emotion"],
            "emotion_score": emotion_analysis["emotion_score"],
            "filler_words": filler_word_analysis,
            "transcription_source": "whisper"
        }
        
        # Include word-level timestamps for visualization
        if whisper_result and 'segments' in whisper_result:
            response_data["segments"] = whisper_result.get('segments', [])
            
        return jsonify(response_data)
    
    except Exception as e:
        logging.error(f"Error during transcription: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

from waitress import serve

if __name__ == '__main__':
    print("Starting server with Waitress...")
    # Set timeout to 5 minutes (300 seconds)
    serve(app, host='0.0.0.0', port=5000, threads=4)
