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

        if (data.success) {
            const combinedData = data.data;

            let csvData = '';

            // Extract headers from the first item
            if (combinedData.length > 0) {
                const item = combinedData[0];
                const headers = ['user_id', 'date', ...Object.keys(item.activities[0])];

                // Modify header for "duration" field
                const durationIndex = headers.indexOf('duration');
                if (durationIndex !== -1) {
                    headers[durationIndex] = 'duration(minutes)';
                }

                // Add headers to CSV (only once)
                csvData += headers.join(',') + '\n';
            }

            // Loop through combinedData and add a row for each item
            combinedData.forEach(item => {
                if (!item.activities || item.activities.length === 0) {
                    return; // Skip documents with no activities
                }
            
                const headers = Object.keys(item.activities[0]);
                const activities = item.activities[0];
                const values = Object.values(activities);
                const user_id = item.user_id;
                let date = item.date;
            
                // Convert duration from milliseconds to minutes
                const durationIndex = headers.indexOf('duration(minutes)');
                if (durationIndex !== -1 && values[durationIndex]) {
                    values[durationIndex] = values[durationIndex] / 60000; // Convert to minutes
                }
            
                // Replace commas with semicolons in the description field
                const descriptionIndex = headers.indexOf('description');
                if (descriptionIndex !== -1 && values[descriptionIndex]) {
                    values[descriptionIndex] = values[descriptionIndex].replace(/,/g, ';');
                }
            
                // Add values to CSV
                csvData += [user_id, date, ...values].join(',') + '\n';
            });


            // Create a Blob with the CSV data
            const blob = new Blob([csvData], { type: 'text/csv' });

            // Create a download link for the CSV file
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fitbit_data_participant${participantNumber}.csv`;

            // Trigger the download
            a.click();

            // Release the URL object
            window.URL.revokeObjectURL(url);
        } else {
            console.error('Error:', data.error);
        }
    } catch (error) {
        console.error(`Error generating CSV for user ${user_id}:`, error);
    }
}


async function handleButtonClick(user_id, participantNumber) {
    try {
        const { access_token } = await fetchTokens(user_id);
        const result = await makeFitbitAPICall(user_id, access_token, participantNumber);

        if (result.success) {
            generateCSV(user_id, participantNumber);
        } else {
            console.error('Error:', result.error);
        }
    } catch (error) {
        console.error(error);
    }
}

// Modify your event listener setup like this:
document.querySelectorAll('.participant-button').forEach(button => {
    button.addEventListener("click", () => {
        const user_id = button.dataset.userId;
        const participantNumber = button.dataset.participantNumber;
        handleButtonClick(user_id, participantNumber);
    });
});



