//data_collect.js

// Fitbit API access token and refresh token
let access_token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1JDWEQiLCJzdWIiOiJCUFM1V1EiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJlY2cgcnNldCByb3h5IHJwcm8gcm51dCByc2xlIHJjZiByYWN0IHJyZXMgcmxvYyByd2VpIHJociBydGVtIiwiZXhwIjoxNjk0MTM4NDcxLCJpYXQiOjE2OTQxMDk2NzF9.EqiloL6Xy8UMsdYJ2e24_jDc-a_tzmWVuAGH3rPJBas"; // Your initial access token
const refresh_token = "2a91b5e92112edd0020d268310ee435e0f37c6044c51db168451555cdb557e0c";

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
                return access_token;
            } else {
                throw new Error('Unable to refresh access token');
            }
        })
        .catch(error => console.error('Error:', error));
}


//Function to get the activity data from the Fitbit API 
//TO READ THIS GO TO INSPECT AND THEN NETWORK AFTER PRESSING THE BUTTON CAUSE THAT MAKES THE API
function generateCsvButton() {
    document.getElementById("generateCsvButton").addEventListener("click", () => {
        // Fetch data from the Fitbit API
        fetch('https://api.fitbit.com/1/user/-/activities/steps/date/today/7d.json', {
            method: "GET",
            headers: { "Authorization": "Bearer " + access_token }
        })
            .then(response => {
                if (response.status === 401) {
                    // If the token has expired, refresh it and retry the request
                    return refreshAccessToken().then(() => generateCsvButton());
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
    });

    // should be with the button 
    fetch('https://api.fitbit.com/1/user/-/activities/date/2023-09-01.json', {
        method: "GET",
        headers: { "Authorization": "Bearer " + access_token }
        })
}

// Call generateCsvButton to set up the event listener
generateCsvButton();
