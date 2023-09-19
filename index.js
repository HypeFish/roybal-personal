//index.js
const express = require('express');
const app = express();
const path = require('path');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const cron = require('node-cron');
const publicPath = '/assets'; // Set the correct public path
const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://skyehigh:${process.env.MONGOPASS}@cluster.evnujdo.mongodb.net/`;
const client = new MongoClient(uri);
app.use(publicPath, express.static(path.join(__dirname, 'assets')));
app.use(express.json());
dotenv.config({ path: 'env/user.env' }); // This will read the env/user.env file and set the environment variables

let access_token;
let refresh_token;
let user_id;
let participantsCollection;
let dataCollection;

async function connectToDatabase() {
    try {
        await client.connect();
        participantsCollection = client.db('Roybal').collection('participants');
        dataCollection = client.db('Roybal').collection('data');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

// Call the connectToDatabase function
connectToDatabase();

//Serve the index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), {
        access_token: access_token,
        refresh_token: refresh_token
    });
});

async function storeDataInDatabase(user_id, fitbitData) {
    try {
        const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10);

        const existingDocument = await dataCollection.findOne({ user_id, date: yesterday });

        if (existingDocument) {
            console.log(`Data for user ${user_id} on ${yesterday} already exists.`);
            return; // Data already exists, no need to store it again
        }

        // Assign the Fitbit data directly to the corresponding fields in the document
        const document = {
            user_id: user_id,
            date: yesterday,
            activities: fitbitData.activities,
            goals: fitbitData.goals,
            summary: fitbitData.summary
        };

        await dataCollection.insertOne(document);
        console.log(`Data stored in the database for user ${user_id} successfully.`);
    } catch (error) {
        console.error('Error storing data in database:', error);
        throw error; // Rethrow the error so it can be caught by the caller
    }
}


// Add a new route to refresh the access token
app.post('/api/refresh_token/:user_id', async (req, res) => {
    console.log('Reached the refresh_token route'); // Add this line

    const user_id = req.params.user_id;

    try {
        const user = await participantsCollection.findOne({ user_id });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const response = await fetch('https://api.fitbit.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')
            },
            body: `grant_type=refresh_token&refresh_token=${user.refresh_token}`
        });

        const data = await response.json();

        if (data.access_token) {
            const newAccessToken = data.access_token;
            const newRefreshToken = data.refresh_token || user.refresh_token;

            const result = await participantsCollection.updateOne(
                { user_id: user_id },
                { $set: { access_token: newAccessToken, refresh_token: newRefreshToken } }
            );

            if (result.modifiedCount > 0) {
                console.log(`Updated access token and refresh token for user ${user_id}`);
            } else {
                console.log(`User ${user_id} not found or access token/refresh token not updated`);
            }

            res.json({ newAccessToken, newRefreshToken });
        } else {
            console.log("block 1!")
            console.error('Error refreshing access token:', data.error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } catch (error) {
        console.log("block 2!")
        console.error('Error refreshing access token:', error);
        res.status(500).json({ error: 'Internal server error' });
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

// Add a new route for collecting Fitbit data
app.post('/api/collect_data/:user_id', async (req, res) => {
    const user_id = req.params.user_id;
    const access_token = req.headers.authorization.split(' ')[1]; // Extract the access token from the Authorization header

    try {
        // Perform Fitbit API call with the obtained access token
        const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10);
        const fitbitDataResponse = await fetch(`https://api.fitbit.com/1/user/${user_id}/activities/date/${yesterday}.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            }
        });

        if (fitbitDataResponse.ok) {
            const fitbitData = await fitbitDataResponse.json();

        
            // Assuming you have a function to store the data in your database
            // You can reuse the logic from your button click handler
            await storeDataInDatabase(user_id, fitbitData);
            console.log(`Data stored in the database for user ${user_id} successfully.`);

            res.json({ success: true, message: 'Data collected and stored successfully.' });
        } else {
            console.error(`HTTP error! status: ${fitbitDataResponse.status}`);
            res.status(500).json({ success: false, error: 'Error collecting data' });
        }
    } catch (error) {
        console.error(`Error fetching data for user ${user_id}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Add a new route to fetch combined Fitbit data for a user
app.get('/api/combined_data/:user_id', async (req, res) => {
    const user_id = req.params.user_id;

    try {
        const userDocuments = await dataCollection.find({ user_id }).toArray();

        if (userDocuments.length === 0) {
            console.error(`No data found for user ${user_id}`);
            res.status(404).json({ error: `No data found for user ${user_id}` });
            return;
        }

        let combinedData = [];
        for (const document of userDocuments) {
            combinedData.push(document);
        }

        res.json({ success: true, data: combinedData });
    } catch (error) {
        console.error(`Error fetching combined data for user ${user_id}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});


// Serve the error page
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Define a cron job to run once every 24 hours
cron.schedule('0 8 * * *', async () => {
    console.log('Running scheduled task...');

    // Fetch all user IDs
    try {
        const response = await fetch('/api/user_ids');
        const data = await response.json();
        const userIDs = data.userIDs;

        // Use the user IDs to collect Fitbit data for each user
        for (const user_id of userIDs) {
            try {
                // Fetch tokens for the specific user_id
                const tokensResponse = await fetch(`/api/tokens/${user_id}`);
                const tokensData = await tokensResponse.json();
                const access_token = tokensData.access_token;

                // Perform Fitbit API call with the obtained access token
                const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10);
                const fitbitDataResponse = await fetch(`https://api.fitbit.com/1/user/${user_id}/activities/date/${yesterday}.json`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    }
                });

                if (fitbitDataResponse.ok) {
                    const fitbitData = await fitbitDataResponse.json();

                    // Assuming you have a function to store the data in your database
                    // You can reuse the logic from your button click handler
                    await storeDataInDatabase(user_id, fitbitData);
                    console.log(`Data stored in the database for user ${user_id} successfully.`);
                } else {
                    console.error(`HTTP error! status: ${fitbitDataResponse.status}`);
                }
            } catch (error) {
                console.error(`Error fetching data for user ${user_id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error fetching user IDs:', error);
    }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log('Press Ctrl+C to quit.');
});
