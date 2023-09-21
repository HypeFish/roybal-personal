// fitbit.js

const fetch = require('node-fetch');

async function getFitbitData(user_id, access_token) {
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10);

    try {
        const fitbitDataResponse = await fetch(`https://api.fitbit.com/1/user/${user_id}/activities/date/${yesterday}.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            }
        });

        if (fitbitDataResponse.ok) {
            return await fitbitDataResponse.json();
        } else {
            console.error(`HTTP error! status: ${fitbitDataResponse.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching Fitbit data for user ${user_id}:`, error);
        return null;
    }
}

module.exports = {
    getFitbitData
};
