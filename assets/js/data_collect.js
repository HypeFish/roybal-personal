//data_collect.js

let allIDs = [];
let allTokens = [];
let access_token;
let refresh_token;

async function fetchUserIDs() {
    const response = await fetch('/api/user_ids');
    return await response.json();
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
    console.log("refresh time")
    try {
        const response = await fetch(`/api/refresh_token/${user_id}`, {
            method: 'POST'});

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error; // Rethrow the error so it can be caught by the caller
    }
}


let apiData = []; // Store the data from API calls

// Function to make API call with user_id
function dailyActivityCollect(user_id) {
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10);

    return fetch(`https://api.fitbit.com/1/user/${user_id}/activities/date/${yesterday}.json`, {
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
    fetchTokens(user_id)
        .then(data => {
            access_token = data.access_token;
            refresh_token = data.refresh_token;
            return dailyActivityCollect(user_id);
        })
        .then(() => generateCSV(participantNumber))
        .catch(error => console.error(error));
}



// Modify your event listener setup like this:

document.querySelectorAll('.participant-button').forEach(button => {
    button.addEventListener("click", () => {
        const user_id = button.dataset.userId;
        const participantNumber = button.dataset.participantNumber;
        handleButtonClick(user_id, participantNumber);
    });
});
