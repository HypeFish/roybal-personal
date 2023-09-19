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


function flattenObject(obj, parentKey = '', result = {}) {
    for (const key in obj) {
        let propName = parentKey ? `${parentKey}_${key}` : key;

        if (key === 'heartRateZones') {
            continue; // Skip heartRateZones property
        }

        if (key === "distances" && Array.isArray(obj[key])) {
            const distanceNames = ['total', 'tracker', 'loggedActivities', 'veryActive', 'moderatelyActive', 'lightlyActive', 'sedentaryActive'];
            obj[key].forEach((distance, index) => {
                result[propName + "_" + distanceNames[index]] = distance.distance;
            });
        } else if (typeof obj[key] === 'object') {
            flattenObject(obj[key], propName, result);
        } else {
            result[propName] = obj[key];
        }
    }
    return result;
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
                const flattenedSummary = flattenObject(item.summary);
                const headers = ['user_id', 'date', ...Object.keys(flattenedSummary), 'Out of Range', 'Fat Burn', 'Cardio', 'Peak', 'total_distance', 'tracker_distance', 'loggedActivities_distance', 'veryActive_distance', 'moderatelyActive_distance', 'lightlyActive_distance', 'sedentaryActive_distance'];

                // Add headers to CSV (only once)
                csvData += headers.join(',') + '\n';
            }

            // Loop through combinedData and add a row for each item
            combinedData.forEach(item => {
                const flattenedSummary = flattenObject(item.summary);
                const values = Object.values(flattenedSummary);
                const user_id = item.user_id;
                const date = item.date;

                // Handle heartRateZones
                const heartRateZones = item.summary.heartRateZones || [];
                const hrzValues = Array(4).fill(0); // Initialize with 0's
                heartRateZones.forEach(zone => {
                    const index = ['Out of Range', 'Fat Burn', 'Cardio', 'Peak'].indexOf(zone.name);
                    if (index !== -1) {
                        hrzValues[index] = zone.minutes;
                    }
                });

                // Handle distances
                const distances = item.summary.distances || [];
                const distanceValues = {
                    total_distance: 0,
                    tracker_distance: 0,
                    loggedActivities_distance: 0,
                    veryActive_distance: 0,
                    moderatelyActive_distance: 0,
                    lightlyActive_distance: 0,
                    sedentaryActive_distance: 0
                };
                distances.forEach(distance => {
                    distanceValues[`${distance.activity}_distance`] = distance.distance;
                });

                // Add values to CSV
                csvData += [user_id, date, ...values, ...hrzValues, ...Object.values(distanceValues)].join(',') + '\n';
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
