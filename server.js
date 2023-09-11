//server.js
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
dotenv.config({ path: 'env/user1.env' }); // This will read the env/user1.env file and set the environment variables

const app = express();

let access_token;
let refresh_token;

async function fetchInitialTokens() {
    let validTokens = false;
    while (!validTokens) {
        const response = await fetch('https://api.fitbit.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `client_id=${process.env.CLIENT_ID}&grant_type=authorization_code&redirect_uri=https%3A%2F%2Froybal.vercel.app%2F&code=46603952c7b2c753eea80e59354ce16412631d0b&code_verifier=6n072h360k124j1t38313o0z2p61706l612e5s5c5v3j2a3v552j3z1g2e220e0m4k3o1q5q3h0o053i363n6t1n3h085i5v6x435u0o236m3t3i4d1u361t3q364m15`
        });

        const data = await response.json();
        
        if (data.access_token && data.refresh_token) {
            validTokens = true;
            access_token = data.access_token;
            refresh_token = data.refresh_token;
            process.env.ACCESS_TOKEN = access_token;
            process.env.REFRESH_TOKEN = refresh_token;
            console.log('Access Token:', process.env.ACCESS_TOKEN);
            console.log('Refresh Token:', process.env.REFRESH_TOKEN);
            console.log('Fitbit Response:', data);
        } else {
            console.log('Invalid tokens, fetching new pair...');
        }
    }
}

fetchInitialTokens();



// Call the function to fetch tokens
fetchInitialTokens();

// Serve static files from the 'assets' directory
const publicPath = '/assets'; // Set the correct public path
app.use(publicPath, express.static(path.join(__dirname, 'assets')));


app.get('/api/tokens', (req, res) => {
    res.json({
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN
    });
});

//Serve the index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN
    });
});

// Serve the error page
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log('Press Ctrl+C to quit.');
});
