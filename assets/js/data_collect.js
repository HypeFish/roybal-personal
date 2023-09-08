//data_collect.js

// Fitbit API access token and refresh token
let access_token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1JDWEQiLCJzdWIiOiJCUFM1V1EiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJlY2cgcnNldCByb3h5IHJudXQgcnBybyByc2xlIHJjZiByYWN0IHJyZXMgcmxvYyByd2VpIHJociBydGVtIiwiZXhwIjoxNjk0MjE2Njg1LCJpYXQiOjE2OTQxODc4ODV9.t3QIglHPp9BiQdKe7PVcwtqsn34nXg5iuqu9nguSjLQ"; // Your initial access token
const refresh_token = "359de592d08bfda8bf1f90b678fb0b0470b53061c8b2c69e764add3d267244cc"; // initial refresh token 

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


}

// Call generateCsvButton to set up the event listener
generateCsvButton();
