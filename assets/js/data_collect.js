//data_collect.js

let allIDs = [];
let apiData = []; // Store the data from API calls

async function fetchUserIDs() {
    const response = await fetch('/api/user_ids');
    return await response.json();
}

// Fetch all user IDs
fetchUserIDs()
    .then(data => {
        let userIDs = data.userIDs;

        // Use the user IDs as needed in your client-side code
        userIDs.forEach(user_id => {
            // Perform actions with each user_id
            allIDs.push(user_id);
        });
    })
    .catch(error => console.error('Error fetching user IDs:', error));


async function fetchTokens(user_id) {
    try {
        const response = await fetch(`/api/tokens/${user_id}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching tokens:', error);
        throw error; // Rethrow the error so it can be caught by the caller
    }
}

async function refreshAccessToken(user_id) {
    try {
        const response = await fetch(`/api/refresh_token/${user_id}`, {
            method: 'POST'
        });

        if (response.ok) {
            const data = await response.json();
            return data.newAccessToken;
        } else {
            console.error('Error refreshing access token:', data.error);
            return null;
        }
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return null;
    }
}

async function makeFitbitAPICall(user_id, access_token, participantNumber) {
    try {
        const response = await fetch(`/api/collect_data/${user_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            }
        })

        if (response.ok) {
            const data = await response.json();
            return { success: true, data };

        } else if (response.status == 401) {
            // Access token expired, trigger token refresh
            const newAccessToken = await refreshAccessToken(user_id);

            if (newAccessToken) {
                return await makeFitbitAPICall(user_id, newAccessToken, participantNumber);
            } else {
                return { success: false, error: 'Error refreshing access token' };
            }
        } else {
            return { success: false, error: `HTTP error! status: ${response.status}` };
        }
    } catch (error) {
        return { success: false, error: 'Internal server error' };
    }
}


async function generateCSV(user_id, participantNumber) {
    try {
        const response = await fetch(`/api/combined_data/${user_id}`);
        const data = await response.json();

        if (!data.success) {
            console.error('Error:', data.error);
            return;
        }

        const combinedData = data.data;
        if (combinedData.length === 0) {
            return;
        }

        const item = combinedData[0];
        const headers = ['user_id', 'date', ...Object.keys(item.activities[0])];
        const durationIndex = headers.indexOf('duration');
        if (durationIndex !== -1) {
            headers[durationIndex] = 'duration(minutes)';
        }
        const csvData = headers.join(',') + '\n';

        const formattedData = combinedData
            .filter(item => item.activities && item.activities.length > 0)
            .map(item => {
                const activity = item.activities[0];
                const values = Object.values(activity);
                const user_id = item.user_id;
                let date = item.date;
                const descriptionIndex = headers.indexOf('description');
                if (descriptionIndex !== -1 && typeof values[descriptionIndex] === 'string') {
                    values[descriptionIndex] = values[descriptionIndex].replace(/,/g, ';');
                }
                const durationIndex = headers.indexOf('duration');
                if (durationIndex !== -1 && values[durationIndex]) {
                    values[durationIndex] = Math.round(values[durationIndex] / 60000 * 100) / 100;
                }
                return [user_id, date, ...values].join(',');
            });

        const csvContent = csvData + formattedData.join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitbit_data_participant${participantNumber}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        //popup that says there is no data for this participant
        alert("There is no data for this participant");
    }
}



async function handleButtonClick(user_id, participantNumber) {
    generateCSV(user_id, participantNumber);
}

// Modify your event listener setup like this:
document.querySelectorAll('.participant-button').forEach(button => {
    button.addEventListener("click", () => {
        const user_id = button.dataset.userId;
        const participantNumber = button.dataset.participantNumber;
        handleButtonClick(user_id, participantNumber);
    });
});



