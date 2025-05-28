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
from flask_cors import CORS
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
# Enable CORS for the Flask app
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})

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
                text_part = match.group(1)
                logging.info(f"Regex extracted text: {text_part}")
                if text_part:  # Only add non-empty text
                    cleaned_text += " " + text_part
            
    result = cleaned_text.strip()
    logging.info(f"Cleaned transcription: {result}")
    return result

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

        logging.info("Transcription completed successfully.")

        return jsonify({
            "transcription": transcription,
            "confidence_score": confidence_score,
            "emotion": emotion_analysis["emotion"],
            "emotion_score": emotion_analysis["emotion_score"]
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
    serve(app, host='0.0.0.0', port=5000)