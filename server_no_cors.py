import ffmpeg
import io
import os
import numpy as np
import logging
import sys
from flask import Flask, request, jsonify, send_from_directory
from vosk import Model, KaldiRecognizer
import vosk
import wave
from scipy.io import wavfile
from transformers import pipeline

vosk.SetLogLevel(-1)  # Suppress logs for better performance

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

# Load the Vosk model
model_path = "model/vosk-model-en-us-0.22"
if not os.path.exists(model_path):
    raise FileNotFoundError(f"Model not found at {model_path}")
model = Model(model_path)

# Load emotion detection pipeline
emotion_detector = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")

def perform_emotion_detection(text):
    """Perform emotion detection on the given text."""
    emotion_result = emotion_detector(text)
    emotion = max(emotion_result, key=lambda x: x['score'])['label']
    emotion_score = max(emotion_result, key=lambda x: x['score'])['score']
    return {
        "emotion": emotion,
        "emotion_score": emotion_score
    }

def detect_filler_words(text):
    """Detect filler words in the transcription text."""
    # Common filler words and phrases
    filler_words = {
        'um': 'hesitation',
        'uh': 'hesitation',
        'er': 'hesitation',
        'ah': 'hesitation', 
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

def clean_transcription(transcription):
    """Clean the transcription text by extracting text from JSON results."""
    import json
    import logging
    
    logging.info(f"Raw transcription: {transcription}")
    
    cleaned_text = ""
    # Handle each JSON object separately
    parts = transcription.strip().split("\n")
    
    for part in parts:
        try:
            if not part.strip():
                continue
                
            # Parse JSON and extract text field
            result = json.loads(part)
            logging.info(f"Parsed JSON: {result}")
            
            if "text" in result:
                text_part = result["text"]
                logging.info(f"Extracted text: {text_part}")
                if text_part:  # Only add non-empty text
                    cleaned_text += " " + text_part
        except json.JSONDecodeError as e:
            logging.error(f"JSON parse error: {e}, for text: {part}")
            # If it's not valid JSON, try to extract anything between quotes after "text"
            import re
            match = re.search(r'"text"\s*:\s*"([^"]*)"', part)
            if match:
                text_part = match[1]
                logging.info(f"Regex extracted text: {text_part}")
                if text_part:  # Only add non-empty text
                    cleaned_text += " " + text_part
            
    result = cleaned_text.strip()
    logging.info(f"Cleaned transcription: {result}")
    return result

# Routes - NO CORS HEADERS ADDED HERE - LETTING NGINX HANDLE IT
@app.route('/transcribe', methods=['POST', 'OPTIONS'])
def transcribe():
    # Special handling for OPTIONS but without adding CORS headers
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
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

        # Process the WAV data with Vosk
        logging.info("Processing WAV data with Vosk...")
        wf = wave.open(io.BytesIO(wav_data), 'rb')
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() != 16000:
            logging.error("Invalid WAV file format.")
            return jsonify({"error": "Audio file must be WAV format mono PCM with 16000 Hz sample rate."}), 400

        recognizer = KaldiRecognizer(model, wf.getframerate())
        transcription = ""
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if recognizer.AcceptWaveform(data):
                result = recognizer.Result()
                transcription += result

        final_result = recognizer.FinalResult()
        transcription += final_result

        # Clean the transcription
        transcription = clean_transcription(transcription)

        # Perform emotion detection
        emotion_analysis = perform_emotion_detection(transcription)
        
        # Perform filler word detection
        filler_word_analysis = detect_filler_words(transcription)
        
        logging.info("Transcription and analysis completed successfully.")
        
        return jsonify({
            "transcription": transcription,
            "confidence_score": confidence_score,
            "emotion": emotion_analysis["emotion"],
            "emotion_score": emotion_analysis["emotion_score"],
            "filler_words": filler_word_analysis
        })
    
    except Exception as e:
        logging.error(f"Error during transcription: {e}")
        return jsonify({"error": "Internal server error"}), 500

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
