from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import speech_recognition as sr
import tempfile
import os

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"status": "API is running"}

@app.post("/api/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    if not audio:
        raise HTTPException(status_code=400, detail="No audio file provided")

    if not audio.filename.endswith(('.wav', '.mp3', '.ogg')):
        raise HTTPException(status_code=400, detail="Invalid audio format. Please upload .wav, .mp3, or .ogg file")

    try:
        # Create temp file to store audio
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            # Write uploaded file to temp file
            content = await audio.read()
            temp_audio.write(content)
            temp_audio.flush()

            # Initialize recognizer
            recognizer = sr.Recognizer()

            # Read the audio file
            with sr.AudioFile(temp_audio.name) as source:
                # Record audio from file
                audio_data = recognizer.record(source)

                try:
                    # Perform the transcription
                    text = recognizer.recognize_google(audio_data)
                    return {"transcription": text, "status": "success"}
                except sr.UnknownValueError:
                    raise HTTPException(status_code=400, detail="Speech recognition could not understand the audio")
                except sr.RequestError as e:
                    raise HTTPException(status_code=500, detail=f"Could not request results from speech recognition service: {str(e)}")
                finally:
                    # Cleanup temp file
                    os.unlink(temp_audio.name)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")