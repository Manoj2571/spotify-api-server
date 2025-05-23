const express = require("express")
const cors = require("cors")
const querystring = require("querystring")
const crypto = require("crypto")
const axios = require("axios")
const { json } = require("stream/consumers")
const cookieParser = require('cookie-parser');
require('dotenv').config();
const {  
  getFollowedArtists,
  getTopTracks,
  getCurrentlyPlaying,
  pausePlayback,
  playTrack
} = require("./apiHelperFunctions")

const app = express()
const corsOptions = {
    origin: "*",
    credentials: true,
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser());

const client_id = process.env.SPOTIFY_CLIENT_ID
const client_secret = process.env.SPOTIFY_CLIENT_SECRET
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI
const base_url = process.env.SPOTIFY_API_BASE_URL

const PORT = process.env.PORT || 3000


const generateRandomString = (length) => {
    return crypto.randomBytes(60).toString('hex').slice(0, length);
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

app.get("/", async (req, res) => {
    res.send("Hello!")
})

app.get("/test", (req, res) => {
  res.send("✅ /test route works!");
});

app.get("/login", async (req, res) => {
    const storedState = generateRandomString(16)
    
    res.cookie('spotify_auth_state', storedState, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' // or 'none' if needed, see below
});

     const scope = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-top-read',
    'user-follow-read'
  ].join(' ');

    res.redirect("https://accounts.spotify.com/authorize?" + querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri
    }))
})

app.get("/test", (req, res) => {
  res.send("✅ /test route works!");
});


app.get("/callback", async (req, res) => {

    const code = req.query.code || null
    const headers = {
      'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    const data = querystring.stringify({
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    });

    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', data, { headers });
        access_token = response.data.access_token;
        refresh_token = response.data.refresh_token;

        const getResponse = await axios.get("https://api.spotify.com/v1/me",{ headers: {
    Authorization: 'Bearer ' + access_token}
  })

      res.send({userData: getResponse.data, access_token, refresh_token })
    } catch (error) {
            console.error(error);
    res.status(400).json({ error: 'invalid_token' });
    }
})


app.get('/spotify/artists/followed', async (req, res) => {
  const access_token = req.headers.authorization?.split(' ')[1]; // Get token from "Bearer <token>"

  if (!access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  try {
    const data = await getFollowedArtists(access_token);
    res.json(data);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});

// Top tracks
app.get('/spotify/tracks/top', async (req, res) => {
  const access_token = req.headers.authorization?.split(' ')[1]; // Get token from "Bearer <token>"

  if (!access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }
     const limit = Math.min(req.query.limit || 10, 50);
  try {
    const data = await getTopTracks(access_token, limit);
    res.json(data);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Failed to fetch top tracks', err });
  }
});

// Now playing
app.get('/spotify/now-playing', async (req, res) => {
  const access_token = req.headers.authorization?.split(' ')[1]; // Get token from "Bearer <token>"

  if (!access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  try {
    const data = await getCurrentlyPlaying(access_token);
    res.json(data || { message: 'Nothing is playing' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch now playing' });
  }
});

// Pause track
app.post('/spotify/stop', async (req, res) => {
  const access_token = req.headers.authorization?.split(' ')[1]; // Get token from "Bearer <token>"

  if (!access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  try {
    await pausePlayback(access_token);
    res.json({ message: 'Playback paused' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pause' });
  }
});

// Play a track
app.post('/spotify/play', async (req, res) => {
  const access_token = req.headers.authorization?.split(' ')[1]; // Get token from "Bearer <token>"

  if (!access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  const { trackUri } = req.body;
  if (!trackUri) return res.status(400).json({ error: 'trackUri required' });

  try {
    await playTrack(access_token, trackUri);
    res.json({ message: 'Track playing' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to play track' });
  }
});  

app.post('/spotify/play/:trackUri', async (req, res) => {
  const access_token = req.headers.authorization?.split(' ')[1]; // Get token from "Bearer <token>"

  if (!access_token) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  const { trackUri } = req.params;

  if (!trackUri) {
    return res.status(400).json({ error: 'trackUri is required in the URL' });
  }

  try {
    await playTrack(access_token, `spotify:track:${trackUri}`);
    res.json({ message: `Track ${trackUri} is now playing` });
  } catch (err) {
    console.error('Failed to play track:', err.message);
    res.status(500).json({ error: 'Failed to play track' });
  }
});



