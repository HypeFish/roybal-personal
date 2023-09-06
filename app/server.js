// On your server (backend):
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.get('/callback', async (req, res) => {
  const code = req.query.code;

  const tokenRequest = {
    method: 'POST',
    url: oauthConfig.tokenUrl,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    params: {
      code,
      redirect_uri: oauthConfig.redirectUri,
      grant_type: 'authorization_code',
    },
    auth: {
      username: oauthConfig.clientId,
      password: oauthConfig.clientSecret,
    },
  };

  try {
    const response = await axios(tokenRequest);
    const accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;
    
    // Store the access token and refresh token securely (e.g., in a database)
    
    res.send('Authentication successful! You can now use the Fitbit API.');
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).send('Error occurred during authentication.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
