import ffmpeg
import os
from flask import Flask, request, jsonify
from vosk import Model, KaldiRecognizer
import vosk
import wave
from flask_cors import CORS

vosk.SetLogLevel(-1)  # Suppress logs for better performance

app = Flask(__name__)
# Enable CORS for the Flask app
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})

# Load the Vosk model
model_path = "model/vosk-model-en-us-0.22"
if not os.path.exists(model_path):
    raise FileNotFoundError(f"Model not found at {model_path}")
model = Model(model_path)

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        if 'audio' not in request.files:
            print("No audio file provided in the request.")
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files['audio']
        webm_path = "uploads/temp.webm"
        wav_path = "uploads/temp.wav"

        # Save the uploaded WebM file
        print("Saving uploaded WebM file...")
        audio_file.save(webm_path)
        print(f"WebM file saved at: {webm_path}")

        # Convert WebM to WAV using ffmpeg with correct format
        try:
            print("Converting WebM to WAV...")
            ffmpeg.input(webm_path).output(
                wav_path,
                format='wav',
                acodec='pcm_s16le',  # 16-bit PCM
                ac=1,                # Mono channel
                ar='16000'           # 16000 Hz sample rate
            ).run(overwrite_output=True)
            print(f"WAV file created at: {wav_path}")
        except ffmpeg.Error as e:
            print(f"FFmpeg error: {e}")
            return jsonify({"error": "Failed to convert WebM to WAV"}), 500

        # Process the WAV file with Vosk
        print("Processing WAV file with Vosk...")
        with wave.open(wav_path, 'rb') as wf:
            if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() != 16000:
                print("Invalid WAV file format.")
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

        # Clean up temporary files
        print("Cleaning up temporary files...")
        os.remove(webm_path)
        os.remove(wav_path)

        print("Transcription completed successfully.")
        return jsonify({"transcription": transcription})
    except Exception as e:
        print(f"Error during transcription: {e}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True)