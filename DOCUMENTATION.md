# ProComm - Speech Analysis Application

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Features](#features)
4. [Setup and Installation](#setup-and-installation)
5. [Deployment](#deployment)
6. [API Reference](#api-reference)
7. [Frontend Components](#frontend-components)
8. [Architecture](#architecture)
9. [Maintenance and Troubleshooting](#maintenance-and-troubleshooting)
10. [Future Improvements](#future-improvements)

## Overview

ProComm is a web application designed to help users improve their public speaking skills by analyzing speech recordings. The application provides insights on speech rate, filler word usage, emotional tone, and other speech quality metrics. It uses a React frontend hosted on GitHub Pages and a Flask backend hosted on an Azure VM.

### Core Technology Stack
- **Frontend**: React.js with Chakra UI
- **Backend**: Python Flask API
- **Speech Recognition**: OpenAI Whisper model
- **Emotion Analysis**: DistilRoBERTa-based classifier
- **Web Server**: Nginx with HTTPS (Let's Encrypt certificates)
- **Audio Processing**: FFmpeg for format conversion

## Project Structure

The application is structured as follows:

```
ProCommReactSon1/
├── build/                   # Production build for GitHub Pages deployment
├── public/                  # Static public assets
├── src/                     # React frontend source code
│   ├── components/          # React components
│   │   ├── Home.js          # Landing page component
│   │   ├── About.js         # About page component
│   │   └── TryIt.js         # Main speech recording/analysis component
│   ├── App.css              # Global styles
│   ├── config.js            # Configuration settings
│   ├── index.js             # React entry point
│   ├── text-styles.js       # Text styling utilities
│   └── theme.js             # Theme configuration
├── server.py                # Flask backend for transcription and analysis
├── Requirements.txt         # Python package dependencies
├── whisper_setup.py         # Script to download and setup Whisper model
├── setup_env.py             # Environment setup script
├── nginx-clean.conf         # Nginx configuration with proper CORS headers
└── package.json             # NPM package configuration
```

## Features

### Speech Recording and Analysis
- **Audio Recording**: Record speech directly from the browser
- **Transcription**: Convert speech to text using OpenAI's Whisper model
- **Speech Rate Analysis**: Calculate words per minute and provide quality feedback
- **Filler Word Detection**: Identify and categorize filler words and verbal crutches
- **Emotion Detection**: Analyze the emotional tone of the speech
- **Vocabulary Richness**: Measure vocabulary diversity and complexity
- **Confidence Scoring**: Assess the overall quality and clarity of the recording

### User Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Feedback**: Immediate analysis after recording
- **Visual Metrics**: Clear visual presentation of speech metrics
- **Accessibility**: High-contrast design with screen reader compatibility

## Setup and Installation

### Prerequisites
- Node.js (v14+) for React frontend
- Python (3.8-3.11) for backend
- FFmpeg for audio processing
- Azure VM or equivalent for hosting the backend

### Frontend Setup (Local Development)
1. Clone the repository
   ```powershell
   git clone https://github.com/user/ProCommReactSon1.git
   cd ProCommReactSon1
   ```

2. Install dependencies
   ```powershell
   npm install
   ```

3. Configure API endpoint
   Create or modify `.env` file:
   ```
   REACT_APP_API_URL=https://40.76.138.219.nip.io
   ```

4. Start development server
   ```powershell
   npm start
   ```

### Backend Setup (Azure VM)
1. SSH into your VM
   ```powershell
   ssh alric@40.76.138.219
   ```

2. Clone the repository (if not already present)
   ```bash
   git clone https://github.com/user/ProCommReactSon1.git
   cd ProCommReactSon1
   ```

3. Create and activate a Python virtual environment
   ```bash
   python3.10 -m venv .venv
   source .venv/bin/activate
   ```

4. Install dependencies
   ```bash
   pip install -r Requirements.txt
   ```

5. Set up Whisper model
   ```bash
   python whisper_setup.py --model-size small
   ```

6. Create static directory and upload build files
   ```bash
   mkdir -p static
   # You'll need to upload the build files separately via SCP or SFTP
   ```

7. Configure Nginx with HTTPS
   ```bash
   sudo cp nginx-clean.conf /etc/nginx/sites-available/procomm
   sudo ln -sf /etc/nginx/sites-available/procomm /etc/nginx/sites-enabled/
   sudo systemctl reload nginx
   ```

## Deployment

### Frontend Deployment (GitHub Pages)
1. Update the `homepage` field in `package.json` (already set to "https://alricfv.github.io/ProCommReact")

2. Build and deploy to GitHub Pages
   ```powershell
   npm run deploy
   ```

### Backend Deployment (Azure VM)

#### Option 1: Run as a systemd service (recommended for production)
1. Create a systemd service file
   ```bash
   sudo nano /etc/systemd/system/procomm.service
   ```

2. Add the following configuration
   ```ini
   [Unit]
   Description=ProComm Flask Application
   After=network.target

   [Service]
   User=alric
   WorkingDirectory=/home/alric/ProComm
   ExecStart=/home/alric/ProComm/.venv/bin/python server.py
   Restart=always
   RestartSec=10
   Environment=PYTHONUNBUFFERED=1
   Environment=WHISPER_MODEL_SIZE=small

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable procomm.service
   sudo systemctl start procomm.service
   ```

4. Verify the service is running
   ```bash
   sudo systemctl status procomm.service
   ```

5. To stop the service:
   sudo systemctl stop procomm.service

6. To restart the service:
   sudo systemctl restart procomm.service

7. To disable auto-start at boot time:
   sudo systemctl disable procomm.service

#### Option 2: Run with Screen (for development/testing)
```bash
screen -S procomm
source .venv/bin/activate
python server.py
# Press Ctrl+A then D to detach
```

To reconnect later:
```bash
screen -r procomm
```

## API Reference

### Transcribe Endpoint
`POST /transcribe`

Records audio and returns transcription along with analysis.

**Request Body:**
- `audio`: WebM audio file
- `duration`: Recording duration in seconds

**Response:**
```json
{
  "transcription": "Text transcription of the audio",
  "confidence_score": 95,
  "emotion": "neutral",
  "emotion_score": 0.85,
  "filler_words": {
    "total_count": 5,
    "categories": {
      "hesitation": 3,
      "verbal_crutch": 2
    },
    "instances": [
      {
        "word": "um",
        "category": "hesitation",
        "context": "I um want to talk about"
      }
    ],
    "frequency_per_minute": 2.5
  },
  "segments": [
    {
      "text": "Segment text",
      "start": 0.0,
      "end": 5.2,
      "words": [
        {
          "word": "Segment",
          "start": 0.0,
          "end": 0.5
        }
      ]
    }
  ]
}
```

### Health Check Endpoint
`GET /health`

Returns a simple health status to verify the API is running.

**Response:**
```json
{
  "status": "healthy"
}
```

## Frontend Components

### Home.js
Landing page component with application introduction and navigation.

### About.js
Information about the application, its features, and how it helps improve speaking skills.

### TryIt.js
The main component that handles:
- Audio recording via the browser's MediaRecorder API
- Speech duration calculation using multiple methods for accuracy
- Sending audio to the backend for transcription
- Processing and displaying analysis results
- Providing feedback on speech quality

Key functions:
- `handleRecord()`: Manages the recording process
- `analyzeSpeech()`: Processes speech metrics
- `calculateSpeechRate()`: Calculates words per minute
- `generateSpeechRateFeedback()`: Provides personalized feedback
- `calculateConfidenceScore()`: Determines overall speech quality score

## Architecture

### Client-Server Communication
1. The React frontend records audio using the MediaRecorder API
2. Audio is sent as a WebM file to the Flask backend via a POST request
3. The backend processes the audio and returns analysis results
4. The frontend displays the results and provides feedback

### Backend Processing Pipeline
1. Flask receives the WebM audio file
2. FFmpeg converts WebM to WAV format
3. Whisper model transcribes the audio
4. Emotion detection model analyzes the emotional content
5. Filler word detection algorithm identifies verbal crutches
6. Flask returns all analysis results as JSON

### CORS and Security
- The application uses HTTPS for all communication
- Nginx handles CORS headers to permit cross-origin requests from the GitHub Pages domain
- SSL certificates are managed through Let's Encrypt

## Maintenance and Troubleshooting

### Common Issues

#### "Module 'ffmpeg' has no attribute 'input'" Error
This occurs when the ffmpeg-python package isn't correctly imported or installed.

**Solution:**
1. Ensure ffmpeg is installed on the system
   ```bash
   sudo apt install ffmpeg
   ```
2. Reinstall the ffmpeg-python package
   ```bash
   pip install --upgrade ffmpeg-python==0.2.0
   ```
3. Use the correct import statement in the code
   ```python
   import ffmpeg
   ```

#### Static Files Not Found (404 Error)
This happens when the Flask app can't find the static files for serving the frontend.

**Solution:**
1. Ensure the static folder exists
   ```bash
   mkdir -p /home/alric/ProComm/static
   ```
2. Copy the build files to the static folder
   ```bash
   scp -r build/* alric@40.76.138.219:/home/alric/ProComm/static/
   ```
3. Verify Flask is configured to use the correct static folder
   ```python
   app = Flask(__name__, static_folder='static')
   ```

#### CORS Issues
If the browser blocks requests due to CORS policy.

**Solution:**
1. Verify the Nginx configuration has the correct CORS headers
   ```bash
   sudo nano /etc/nginx/sites-available/procomm
   ```
2. Ensure the Access-Control-Allow-Origin header has the correct origin
   ```nginx
   add_header 'Access-Control-Allow-Origin' 'https://alricfv.github.io' always;
   ```
3. Reload Nginx
   ```bash
   sudo systemctl reload nginx
   ```

### Logs and Monitoring

#### View Flask Application Logs
```bash
tail -f /home/alric/ProComm/server.log
```

#### View Systemd Service Logs
```bash
sudo journalctl -u procomm.service -f
```

#### View Nginx Error Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

## Future Improvements

1. **Real-time Analysis**: Provide feedback during recording instead of only after completion
2. **Multiple Language Support**: Add transcription for languages beyond English
3. **User Accounts**: Allow users to save and track progress over time
4. **Comparative Analysis**: Compare current speech with previous recordings
5. **Advanced Metrics**: Add metrics for pace variation, pitch, and vocal variety
6. **Mobile App**: Develop a dedicated mobile application
7. **Offline Support**: Allow the application to work without internet connection
8. **Integration with Presentation Software**: Direct integration with PowerPoint/Google Slides

---

Created on: June 7, 2025  
Last updated: June 7, 2025
