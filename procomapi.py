from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from pydantic import BaseModel
import os
import sounddevice as sd
from scipy.io.wavfile import write
import whisper
import re
import tempfile

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Whisper model
model = whisper.load_model("tiny")

# Endpoint to record audio
@app.post("/record/")
def record_audio(duration: int = 0):
    try:
        fs = 44100  # Sample rate
        channels = 1  # Reduce to mono audio
        myrecording = sd.rec(int(duration * fs), samplerate=fs, channels=channels, dtype='float32')
        sd.wait()  # Wait until recording is finished

        filename = 'outp.wav'
        if os.path.exists(filename):
            os.remove(filename)  # Remove the existing file

        try:
            write(filename, fs, myrecording)
        except Exception as e:
            return {"error": f"Failed to save audio: {str(e)}"}, 500

        if not os.path.exists(filename):
            return {"error": "Failed to verify recording file"}, 500
            
        return {"message": "Recording successful"}
    except Exception as e:
        return {"error": f"Recording failed: {str(e)}"}, 500

# Endpoint to transcribe audio using Whisper
@app.post("/api/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
        content = await audio.read()
        temp_audio.write(content)
        temp_audio.flush()

        try:
            result = model.transcribe(temp_audio.name)
            transcription = result["text"]
            os.unlink(temp_audio.name)
            return {"transcription": transcription}
        except Exception as e:
            os.unlink(temp_audio.name)
            raise HTTPException(status_code=500, detail=str(e))


# Endpoint to perform speech analysis
@app.post("/analyze/")
def analyze_audio():
    mysp = __import__("my-voice-analysis")
    p = "outp"  # Audio file title without extension
    c = r"C:\Users\alric\Documents\work\Ultimate\Appfiles"  # Path to the audio file directory

    # Perform analysis
    analysis_results = {
        "speech_rate": mysp.myspsr(p, c),
        "pauses": mysp.mysppaus(p, c),
        "syllables": mysp.myspsyl(p, c),
        "speaking_time": mysp.myspst(p, c),
        "original_duration": mysp.myspod(p, c),
        "balance": mysp.myspbala(p, c),
        "pronunciation_score": mysp.mysppron(p, c),
        "gender_prediction": mysp.myspgend(p, c),
    }

    return {"analysis_results": analysis_results}

# Utility function to format analysis output
def format_analysis_output(text):
    text = re.sub(r'[{}]', '', text)  # Remove all curly brackets
    formatted_text = re.sub(r'(\S)\n(\S)', r'\1\n\n\2', text)  # Add extra line between non-space lines
    return formatted_text