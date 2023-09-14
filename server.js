//server.js
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const app = express();
dotenv.config({ path: 'env/user1.env' }); // This will read the env/user1.env file and set the environment variables
dotenv.config({ path: 'env/user2.env' }); // This will read the env/user2.env file and set the environment variables
const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://skyehigh:${process.env.MONGOPASS}9@cluster.evnujdo.mongodb.net/`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let participantsCollection;

async function connectToDatabase() {
    try {
        await client.connect();
        participantsCollection = client.db('Roybal').collection('participants');
        dataCollection = client.db('Roybal').collection('data');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error; // Rethrow the error so it can be caught by the calling function
    }
}

// Call the connectToDatabase function
connectToDatabase();

let access_token;
let refresh_token;
let user_id;


// Serve static files from the 'assets' directory
const publicPath = '/assets'; // Set the correct public path
app.use(publicPath, express.static(path.join(__dirname, 'assets')));
app.use(express.json());

app.post('/api/fitbit-data/:user_id', async (req, res) => {
    const user_id = req.params.user_id;
    const today = new Date().toISOString().slice(0, 10);
    const data = req.body; // Assuming the Fitbit data is sent in the request body

    try {
        const existingDocument = await dataCollection.findOne({ user_id, date: today });

        if (existingDocument) {
            console.log(`Data for user ${user_id} on ${today} already exists.`);
            res.status(200).json({ success: true, message: 'Data already exists' });
            return;
        }

        const document = {
            user_id: user_id,
            date: today,
            ...data
        };

        dataCollection.insertOne(document);
        res.status(200).json({ success: true, message: 'Data recorded successfully' });
    } catch (error) {
        console.error('Error saving data to database:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});



// Add a new route for the authorization callback
app.get('/auth/callback', async (req, res) => {
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
    user_id = data.user_id;

    try {
        const result = await participantsCollection.updateOne(
            { user_id: user_id },
            {
                $set: {
                    authorization_code: authorizationCode,
                    access_token: access_token,
                    refresh_token: refresh_token
                }
            },
            { upsert: true } // Update existing record or insert new if not found
        );

        if (result.modifiedCount > 0) {
            console.log(`Updated record for user ${user_id}`);
        } else if (result.upsertedCount > 0) {
            console.log(`Inserted new record for user ${user_id}`);
        }

    } catch (error) {
        console.error('Error updating database:', error);
        throw error;
    }
});

// Add a new route to fetch all user IDs
app.get('/api/user_ids', async (req, res) => {
    try {
        const userIDs = await participantsCollection.distinct('user_id');
        res.json({ userIDs });
    } catch (error) {
        console.error('Error fetching user IDs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.get('/api/tokens/:user_id', (req, res) => {
    const user_id = req.params.user_id;

    // Fetch tokens for the specified user_id from the database
    // Return them as JSON
    participantsCollection.findOne({ user_id })
        .then(user => {
            if (user) {
                res.json({
                    access_token: user.access_token,
                    refresh_token: user.refresh_token,
                });
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        })
        .catch(error => {
            console.error('Error fetching tokens:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});

//Serve the index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), {
        access_token: access_token,
        refresh_token: refresh_token
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
