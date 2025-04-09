const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const speech = require('@google-cloud/speech'); // Requires installation: npm install @google-cloud/speech
const fs = require('node:fs');
const path = require('node:path');


const app = express();
const port = 3000;

app.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioFile = req.file.path;
    const client = new speech.SpeechClient();

    const [response] = await client.recognize({
        audio: {
            content: fs.readFileSync(audioFile).toString('base64'),
        },
        config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000, // Adjust if necessary
            languageCode: 'en-US', // Adjust to your needed language
        },
    });

    const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');

    fs.unlink(audioFile, (err) => {
        if (err) {
          console.error(err)
          return;
        }
    });

    res.json({ transcription: transcription, status: 'success' });
});


app.get('/', (req, res) => {
    res.send('API is running');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});