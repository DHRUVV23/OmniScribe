import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { runMeetBot } from './meetbot.js';
import fs from 'fs';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Increase JSON payload size limit
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(__dirname));

// Store results in memory (in a production app, use a database)
const meetingResults = {};

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the results page
app.get('/results/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'results.html'));
});

// Get meeting results by ID
app.get('/api/results/:id', (req, res) => {
  const meetingId = req.params.id;
  if (meetingResults[meetingId]) {
    res.json(meetingResults[meetingId]);
  } else {
    res.status(404).json({ error: 'Meeting results not found' });
  }
});

// Start MeetBot endpoint
app.post('/start-meetbot', async (req, res) => {
  const { email, password, meetId } = req.body;
  
  // Validate required fields
  if (!email || !password || !meetId) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields" 
    });
  }
  
  console.log(`Starting MeetBot for meeting ID: ${meetId}`);
  
  try {
    // Generate a unique session ID
    const sessionId = Date.now().toString();
    
    // Start the MeetBot process
    const result = await runMeetBot(email, password, meetId);
    
    // Store the results
    meetingResults[sessionId] = {
      success: true,
      meetId,
      timestamp: new Date().toISOString(),
      result: {
        transcript: result.transcript || 'No transcript available',
        summary: result.summary || 'No summary available'
      }
    };
    
    console.log("MeetBot execution completed successfully");
    res.json({ 
      success: true,
      sessionId, // Return the session ID for accessing results
      result: {
        transcript: result.transcript || 'No transcript available',
        summary: result.summary || 'No summary available'
      }
    });
  } catch (error) {
    console.error('Error running MeetBot:', error);
    
    // Send detailed error response
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

// List all available meeting results
app.get('/api/meetings', (req, res) => {
  const meetings = Object.keys(meetingResults).map(id => ({
    id,
    meetId: meetingResults[id].meetId,
    timestamp: meetingResults[id].timestamp
  }));
  
  res.json(meetings);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Test the server at http://localhost:${PORT}/test`);
});