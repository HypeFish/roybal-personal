//server.js
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
dotenv.config({ path: 'env/user1.env' }); // This will read the env/user1.env file and set the environment variables
dotenv.config({ path: 'env/user2.env' }); // This will read the env/user2.env file and set the environment variables

const app = express();

let access_token;
let refresh_token;

// async function fetchInitialTokens() {
//     let validTokens = false;
//     let retryCount = 0;
    
//     while (!validTokens && retryCount < MAX_RETRY_COUNT) {
//         try {
//             const response = await fetch('https://api.fitbit.com/oauth2/token', {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')}`,
//                     'Content-Type': 'application/x-www-form-urlencoded'
//                 },
//                 body: `client_id=${process.env.CLIENT_ID}&grant_type=authorization_code&redirect_uri=${process.env.REDIRECT_URI}&code=${process.env.CODE}&code_verifier=${process.env.PKCE_CODE_VERIFIER}`
//             });

//             const data = await response.json();

//             if (data.access_token && data.refresh_token) {
//                 validTokens = true;
//                 access_token = data.access_token;
//                 refresh_token = data.refresh_token;
//                 process.env.ACCESS_TOKEN = access_token;
//                 process.env.REFRESH_TOKEN = refresh_token;

//                 console.log('Access Token:', process.env.ACCESS_TOKEN);
//                 console.log('Refresh Token:', process.env.REFRESH_TOKEN);
//                 console.log('Fitbit Response:', data);
//             } else {
//                 console.log('Invalid tokens, fetching new pair...');
//             }
//         } catch (error) {
//             console.error('Error fetching tokens:', error);
//         } finally {
//             retryCount++;
//         }
//     }
// }

// const MAX_RETRY_COUNT = 3; // Define a maximum number of retries

// fetchInitialTokens();

// Serve static files from the 'assets' directory
const publicPath = '/assets'; // Set the correct public path
app.use(publicPath, express.static(path.join(__dirname, 'assets')));


// Add a new route for the authorization callback
app.get('/auth/callback', async (req, res) => {
    console.log('Reached /auth/callback');
    res.sendFile(path.join(__dirname, 'index.html'));
    res.redirect('/');

    const authorizationCode = req.query.code; // Extract the authorization code from the URL

    // Use the authorization code to obtain access token
    const response = await fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `client_id=${process.env.CLIENT_ID}&grant_type=authorization_code&redirect_uri=${process.env.REDIRECT_URI}&code=${authorizationCode}&code_verifier=${process.env.PKCE_CODE_VERIFIER}`
    });

    const data = await response.json();
    access_token = data.access_token;
    refresh_token = data.refresh_token;

    process.env.ACCESS_TOKEN = access_token;
    process.env.REFRESH_TOKEN = refresh_token;

    console.log('Access Token:', process.env.ACCESS_TOKEN);
    console.log('Refresh Token:', process.env.REFRESH_TOKEN);
    console.log('Fitbit Response:', data);

    
});

app.get('/api/tokens', (req, res) => {
    res.json({
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
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
