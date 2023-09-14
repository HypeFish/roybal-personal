//data_collect.js

let allIDs = [];
let allTokens = [];

function fetchUserIDs() {
    return fetch('/api/user_ids')
        .then(response => response.json());
}

// Fetch all user IDs
fetchUserIDs()
    .then(data => {
        const userIDs = data.userIDs;

        // Use the user IDs as needed in your client-side code
        userIDs.forEach(user_id => {
            // Perform actions with each user_id
            allIDs.push(user_id);
        });
    })
    .catch(error => console.error('Error fetching user IDs:', error));


function fetchTokens(user_id) {
    return fetch(`/api/tokens/${user_id}`)
        .then(response => response.json());
}

function refreshAccessToken(user_id) {
    return fetch(`/api/refresh_token/${user_id}`)
        .then(response => response.json());
}

function refreshAccessToken() {
    return fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic MjNSQ1hEOmYxZDRiZmYzZmNhZmEwM2UxYzkyMDA5NDEyMjI0YjI2'
        },
        body: `grant_type=refresh_token&refresh_token=${refresh_token}`
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.access_token) {
            access_token = data.access_token;
            refresh_token = data.refresh_token;
            saveTokensToStorage(access_token, refresh_token); // Save the tokens to storage
            return access_token;
        } else {
            throw new Error('Unable to refresh access token');
        }
    })
    .catch(error => console.error('Error:', error));
}

let apiData = []; // Store the data from API calls

// Function to make API call with user_id
function dailyActivityCollect(user_id) {
    const today = new Date().toISOString().slice(0, 10);

    return fetch(`https://api.fitbit.com/1/user/${user_id}/activities/date/${today}.json`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}` // Assuming access_token is available
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                // Attempt to refresh the access token
                return refreshAccessToken(user_id)
                    .then(() => dailyActivityCollect(user_id)); // Retry the API call
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        return response.json();
    })
    .then(data => {
        // Send the data to the server for storage
        return fetch(`/api/fitbit-data/${user_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data) // Send the data as JSON
        });
    })
    .catch(error => {
        console.error(error);
        throw error;
    });
}


function flattenObject(obj, parentKey = '', result = {}) {
    for (const key in obj) {
        let propName = parentKey ? `${parentKey}_${key}` : key;

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


function generateCSV(participantNumber) {
    let csvData = "";

    // Assuming apiData contains only one item
    const summary = apiData[0].summary;

    const flattenedSummary = flattenObject(summary);

    // Extract headers
    const headers = Object.keys(flattenedSummary);

    // Add headers to CSV and add date header after
    csvData += headers.join(',') + ',date\n';
    
    // Add values to CSV and add date value after
    const values = headers.map(header => flattenedSummary[header]);
    csvData += values.join(',') + ',' + new Date().toISOString().slice(0, 10) + '\n';

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
}


function handleButtonClick(user_id, participantNumber) {
    // Fetch tokens for the specific user_id
    fetchTokens(user_id)
        .then(data => {
            access_token = data.access_token;
            refresh_token = data.refresh_token;

            // Perform Fitbit API call with the obtained tokens
            return dailyActivityCollect(user_id);
        })
        .then(() => generateCSV(participantNumber))
        .catch(error => console.error(error));
}

// ... (your existing code)

// Modify your event listener setup like this:

document.querySelectorAll('.participant-button').forEach(button => {
    button.addEventListener("click", () => {
        const user_id = button.dataset.userId;
        const participantNumber = button.dataset.participantNumber;
        handleButtonClick(user_id, participantNumber);
    });
});
