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

function flattenObject(obj, parentKey = '', result = {}) {
    for (const key in obj) {
        let propName = parentKey ? `${parentKey}_${key}` : key;
        if (key === "distances" && Array.isArray(obj[key])) {
            const distanceNames = ['total', 'tracker', 'loggedActivities', 'veryActive', 'moderatelyActive', 'lightlyActive', 'sedentaryActive'];
            obj[key].forEach((distance, index) => {
                result[propName + "_" + distanceNames[index]] = distance.distance || '0';
            });
        } else if (typeof obj[key] === 'object') {
            flattenObject(obj[key], propName, result);
        } else {
            result[propName] = obj[key] || '0';
        }
    }
    return result;
}

function flattenHeartRateZones(obj, parentKey = '', result = {}) {
    for (const key in obj) {
        let propName = parentKey ? `${parentKey}_${key}` : key;
        if (key === "heartRateZones" && Array.isArray(obj[key])) {
            const zoneNames = ['Out of Range', 'Fat Burn', 'Cardio', 'Peak'];
            obj[key].forEach((zone, index) => {
                result[propName + "_" + zoneNames[index]] = zone.minutes || '0';
            });
        } else if (typeof obj[key] === 'object') {
            flattenHeartRateZones(obj[key], propName, result);
        } else {
            result[propName] = obj[key] || '0';
        }
    }
    return result;
}

async function generateCSV(user_id, participantNumber) {
    try {
        const response = await fetch(`/api/fetch_combined_data/${user_id}`);
        const data = await response.json();

        if (data.success) {
            const combinedData = data.data;

            let csvData = "";

            // Loop through combinedData and add a row for each item
            combinedData.forEach(item => {
                const summary = item.summary;
                const heartRateZones = item.heartRateZones;
                const flattenedSummary = flattenObject(summary);
                const flattenedHeartRateZones = flattenHeartRateZones(heartRateZones);
                const headers = Object.keys(flattenedSummary).concat(Object.keys(flattenedHeartRateZones));
                const values = headers.map(header => flattenedSummary[header] || '0');
                const date = item.date;

                // Add headers to CSV
                if (!csvData) {
                    csvData += headers.join(',') + ',date\n';
                }

                // Add values to CSV and add date value after
                csvData += values.join(',') + ',' + date + '\n';
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

        } else if (response.status === 401) {
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


// Modify your event listener setup like this:

document.querySelectorAll('.participant-button').forEach(button => {
    button.addEventListener("click", () => {
        const user_id = button.dataset.userId;
        const participantNumber = button.dataset.participantNumber;
        handleButtonClick(user_id, participantNumber);
    });
});
