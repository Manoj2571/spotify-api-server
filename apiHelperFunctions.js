const axios = require('axios');
require('dotenv').config();

const spotify_base_url = process.env.SPOTIFY_API_BASE_URL


const getAuthHeaders = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`
});


const getFollowedArtists = async (accessToken) => {
  const response = await axios.get(`${spotify_base_url}/me/following?type=artist`, {
    headers: getAuthHeaders(accessToken)
  });
  return response.data;
};


const getTopTracks = async (accessToken, limit ) => {
  const response = await axios.get(`${spotify_base_url}/me/top/tracks?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  return response.data;
};


const getCurrentlyPlaying = async (accessToken) => {
  const response = await axios.get(`${spotify_base_url}/me/player/currently-playing`, {
    headers: getAuthHeaders(accessToken)
  });
  return response.data;
};


const pausePlayback = async (accessToken) => {
  await axios.put(`${spotify_base_url}/me/player/pause`, {}, {
    headers: getAuthHeaders(accessToken)
  });
};


const playTrack = async (accessToken, trackUri) => {
  await axios.put(`${spotify_base_url}/me/player/play`, {
    uris: [trackUri]
  }, {
    headers: getAuthHeaders(accessToken)
  });
};

module.exports = {
  getFollowedArtists,
  getTopTracks,
  getCurrentlyPlaying,
  pausePlayback,
  playTrack
};
