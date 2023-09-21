const cron = require('node-cron');
const axios = require('axios');
const nodemailer = require('nodemailer');
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const clientTwilio = require('twilio')(accountSid, authToken);

let planCollection; // Declare a variable to hold the planCollection

function setPlanCollection(collection) {
    planCollection = collection;
}

// Create a transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL, // Your email address
        pass: process.env.PASSWORD // Your password
    }
});

// Function to send an email
const sendEmail = async (to, subject, body) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL, // Sender's email address
            to, // Recipient's email address
            subject, // Email subject
            text: body // Plain text body
        });
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendSMS = async (to, body) => {
    try {
        const message = await clientTwilio.messages.create({
            body: body,
            from: process.env.TWILIO_NUMBER, // Twilio phone number
            to: to // Recipient's phone number
        });
        console.log('SMS sent:', message.sid);
    } catch (error) {
        console.error('Error sending SMS:', error);
    }
};

const fitbitDataCollectionJob = new cron.schedule('53 10 * * *', async () => {
    console.log('Running scheduled Fitbit data collection task...');
    // Fetch all user IDs
    try {
        const response = await axios.get('http://roybal.vercel.app/api/user_ids');
        const userIDs = response.data.userIDs;

        // Use the user IDs to collect Fitbit data for each user
        for (const user_id of userIDs) {
            try {
                const tokensResponse = await axios.get(`http://roybal.vercel.app/api/tokens/${user_id}`);
                let { access_token, refresh_token, expires_in } = tokensResponse.data;
        
                // Check if access token is expired
                if (Date.now() > expires_in) {
                    // Call your refresh token route
                    const refreshResponse = await axios.post(`http://roybal.vercel.app/api/refresh-token/${user_id}`, {
                        refresh_token
                    });
        
                    // Update access token with the new one
                    access_token = refreshResponse.data.access_token;
                }
        

                // Perform Fitbit API call with the obtained access token
                const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10);
                const fitbitDataResponse = await axios.get(`https://api.fitbit.com/1/user/${user_id}/activities/date/${yesterday}.json`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    }
                });

                if (fitbitDataResponse.status === 200) {
                    const fitbitData = fitbitDataResponse.data;

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
}, null, true, 'America/New_York'); // Timezone may need adjustment

const emailSendingJob = new cron.schedule('53 10 * * *', async () => {
    console.log('Running scheduled email sending task...');

    const currentDate = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()];

    const plans = await planCollection.find({ selectedDays: dayOfWeek }).toArray();

    plans.forEach(async (plan) => {
        const email = plan.email;

        const subject = 'You planned to walk today';
        const body = 'Don\'t forget to get your steps in today!';

        await sendEmail(email, subject, body);
    });
}, null, true, 'America/New_York');

// Define the SMS sending cron job
const smsSendingJob = new cron.schedule('53 10 * * *', async () => {
    console.log('Running scheduled SMS sending task...');

    const currentDate = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()];

    const plans = await planCollection.find({ selectedDays: dayOfWeek }).toArray();

    plans.forEach(async (plan) => {
        const phone = plan.phone; // Assuming the phone number is stored in 'phone' field

        const body = 'Don\'t forget to get your steps in today!';

        await sendSMS(phone, body);
    });
}, null, true, 'America/New_York');

module.exports = {
    fitbitDataCollectionJob,
    emailSendingJob,
    smsSendingJob,
    setPlanCollection // Export the function to set the planCollection
};
