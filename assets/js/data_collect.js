//data_collect.js

// Fitbit API access token and refresh token
let access_token;
let refresh_token;

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
                access_token = data.access_token; // Update the access token
                if (data.refresh_token) {
                    refresh_token = data.refresh_token; // Update the refresh token
                }
                return access_token;
            } else {
                throw new Error('Unable to refresh access token');
            }
        })
        .catch(error => console.error('Error:', error));
}

// Function to make the API call with the current access token
function makeApiCall() {
    console.log('Making API call with access token:', access_token + " " + refresh_token)
    fetch('https://api.fitbit.com/1/user/-/activities/steps/date/today/7d.json', {
        method: "GET",
        headers: { "Authorization": "Bearer " + access_token }
    })
    .then(response => {
        if (response.status === 401) {
            // If the token has expired, refresh it and retry the request
            return refreshAccessToken().then(() => makeApiCall());
        }
        return response.json();
    })
    .then(json => {
        // Create a CSV string with a title row
        let csvData = "Date,Step Counter\n";
        csvData += json["activities-steps"].map(item => {
            return `${item.dateTime},${item.value}`;
        }).join('\n');

        // Create a Blob with the CSV data
        const blob = new Blob([csvData], { type: 'text/csv' });

        // Create a download link for the CSV file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'steps.csv';

        // Trigger the download
        a.click();

        // Release the URL object
        window.URL.revokeObjectURL(url);
    })
    .catch(error => console.error(error));
}

// Function to handle the button click event
function handleButtonClick() {
    // Fetch data from the Fitbit API
    makeApiCall();
}

// Attach the click event handler to the button
document.getElementById("generateCsvButton").addEventListener("click", handleButtonClick);
