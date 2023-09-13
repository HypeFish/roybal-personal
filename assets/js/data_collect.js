//data_collect.js

// Fitbit API access token and refresh token
let access_token = localStorage.getItem('access_token');
let refresh_token = localStorage.getItem('refresh_token');

function saveTokensToStorage(access_token, refresh_token) {
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
}

fetch('/api/tokens')
    .then(response => response.json())
    .then(data => {
        access_token = data.access_token;
        refresh_token = data.refresh_token;

        // Use the tokens as needed
    })
    .catch(error => console.error('Error:', error));

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

function dailyActivityCollect(clientId) {
    const today = new Date().toISOString().slice(0, 10);

    console.log('Making API call with access token:', access_token);
    return fetch(`https://api.fitbit.com/1/user/${clientId}/activities/date/${today}.json`, {
        method: "GET",
        headers: { "Authorization": "Bearer " + access_token }
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    // Attempt to refresh the access token
                    return refreshAccessToken()
                        .then(() => dailyActivityCollect(clientId)); // Retry the API call
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            return response.json();
        })
        .then(json => {
            apiData.push(json);
        })
        .catch(error => {
            console.error(error);
            throw error; // Rethrow the error to be caught by the calling function
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


function handleButtonClick(clientId, participantNumber) {
    // Fetch data from the Fitbit API
    dailyActivityCollect(clientId)
        .then(() => generateCSV(participantNumber))
        .catch(error => console.error(error));
}

const participants = [
    { clientId: "BPS5WQ", participantNumber: 1 },
    { clientId: "BP63G3", participantNumber: 2 },
    // Add more participants as needed
];

participants.forEach(participant => {
    const button = document.getElementById(`Participant${participant.participantNumber}`);
    button.addEventListener("click", () => {
        handleButtonClick(participant.clientId, participant.participantNumber);
    });
});

