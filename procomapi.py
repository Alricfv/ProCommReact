from fastapi import FastAPI, UploadFile, Form
from pydantic import BaseModel
import os
import sounddevice as sd
from scipy.io.wavfile import write
import whisper
import re

app = FastAPI()

# Endpoint to record audio
@app.post("/record/")
def record_audio(duration: int = Form(...)):
    fs = 44100  # Sample rate
    myrecording = sd.rec(int(duration * fs), samplerate=fs, channels=2)
    sd.wait()  # Wait until recording is finished

    filename = 'outp.wav'
    if os.path.exists(filename):
        os.remove(filename)  # Remove the existing file

    write(filename, fs, myrecording)
    return {"message": f"Audio recorded for {duration} seconds and saved as {filename}"}

# Endpoint to transcribe audio
@app.post("/transcribe/")
def transcribe_audio():
    model = whisper.load_model("tiny")
    result = model.transcribe("outp.wav")
    transcription = result["text"]

    with open('transcrib.txt', 'w') as f:
        f.write(transcription)

    return {"transcription": transcription}

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