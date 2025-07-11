// recordingsRoutes.js - Express routes with Auth0 authentication for MongoDB user-partitioned recordings

const express = require('express');
const { auth } = require('express-oauth2-jwt-bearer');
const {
  saveRecording,
  getRecordings,
  deleteRecording,
  updateRecording,
} = require('./recordingsApi');

const router = express.Router();

// Auth0 JWT validation middleware
const requireAuth = auth({
  issuerBaseURL: 'https://YOUR_AUTH0_DOMAIN/', // Replace with your Auth0 domain
  audience: 'YOUR_API_IDENTIFIER', // Replace with your API identifier
});

// Save a new recording
router.post('/recordings', requireAuth, async (req, res) => {
  const userId = req.auth.payload.sub; // Auth0 user ID
  const recording = req.body;
  try {
    const result = await saveRecording(userId, recording);
    res.json({ _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all recordings for a user
router.get('/recordings', requireAuth, async (req, res) => {
  const userId = req.auth.payload.sub;
  try {
    const recordings = await getRecordings(userId);
    res.json(recordings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a recording
router.delete('/recordings/:id', requireAuth, async (req, res) => {
  const userId = req.auth.payload.sub;
  const recordingId = req.params.id;
  try {
    const result = await deleteRecording(userId, recordingId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a recording
router.put('/recordings/:id', requireAuth, async (req, res) => {
  const userId = req.auth.payload.sub;
  const recordingId = req.params.id;
  const updates = req.body;
  try {
    const result = await updateRecording(userId, recordingId, updates);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
