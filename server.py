import ffmpeg
import io
import os
import numpy as np
import sys
import tempfile
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from scipy.io import wavfile
from transformers import pipeline
import whisper # type: ignore
import logging
from src.api.recordings_api import recordings_api

# Disable all logging by setting level to CRITICAL and removing handlers
logging.basicConfig(level=logging.CRITICAL)
for handler in logging.root.handlers[:]:
    logging.root.removeHandler(handler)

app = Flask(__name__, static_folder='static')

# Register the recordings_api blueprint
app.register_blueprint(recordings_api, url_prefix='/api')

# Initialize CORS to allow requests from localhost for development
allowed_origins = ["http://localhost:3000", "http://localhost:5000", "http://127.0.0.1:3000", "http://127.0.0.1:5000"]
CORS(app, resources={r"/*": {"origins": allowed_origins}})

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

        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

from waitress import serve

if __name__ == '__main__':
    # Set timeout to 5 minutes (300 seconds)
    serve(app, host='0.0.0.0', port=5000, threads=4)