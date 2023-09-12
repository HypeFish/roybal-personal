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
            body: `client_id=${process.env.CLIENT_ID}&grant_type=authorization_code&redirect_uri=https%3A%2F%2Froybal.vercel.app%2F&code=5e9199f82d0576b78e05d4e9f91305398ca533bf&code_verifier=674y2v5e2w68623k601u62643k112q3m281g010v1f4o0p424f73102v5i5i453623711i3n5a2a1n16364g1j6q0g406321392e6d17473e100i1w244c4554494e4f`
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
