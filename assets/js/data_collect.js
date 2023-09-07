//data_collect.js

// Fitbit API access token and refresh token
let access_token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1JDWEQiLCJzdWIiOiJCUFM1V1EiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJlY2cgcnNldCByb3h5IHJwcm8gcm51dCByc2xlIHJjZiByYWN0IHJyZXMgcmxvYyByd2VpIHJociBydGVtIiwiZXhwIjoxNjk0MTM4NDcxLCJpYXQiOjE2OTQxMDk2NzF9.EqiloL6Xy8UMsdYJ2e24_jDc-a_tzmWVuAGH3rPJBas"; // Your initial access token
const refresh_token = "37a61a939b3aa0b7d308a571283a658987e93622e8ea24dde02683ec95974505";

function refreshAccessToken() {
    return fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic MjNSQ1hEOmYxZDRiZmYzZmNhZmEwM2UxYzkyMDA5NDEyMjI0YjI2' // Replace with your client ID and secret
        },
        body: `grant_type=refresh_token&refresh_token=${refresh_token}`
    })
        .then(response => response.json())
        .then(data => {
            if (data.access_token) {
                access_token = data.access_token; // Update the access token
                return access_token;
            } else {
                throw new Error('Unable to refresh access token');
            }
        });
}

//Function to get the activity data from the Fitbit API 
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


// Assuming you have the functions from your previous code for API calls and generating today's date.


function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0 in JavaScript
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getPreviousWeekStartDate() {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const year = lastWeek.getFullYear();
    const month = String(lastWeek.getMonth() + 1).padStart(2, '0');
    const day = String(lastWeek.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function generateCsv(data) {
    // Create a CSV string with a title row
    let csvData = "Date,Step Counter\n";
    csvData += data.map(item => {
        return `${item.dateTime},${item.value}`;
    }).join('\n');
    return csvData;
}

// Make API calls
Promise.all([
    fetch(`https://api.fitbit.com/1/user/-/activities/steps/date/${getTodayDate()}.json`, {
        method: "GET",
        headers: { "Authorization": "Bearer " + access_token }
    }).then(response => response.json()),
    fetch(`https://api.fitbit.com/1/user/-/activities/steps/date/${getPreviousWeekStartDate()}/1d.json`, {
        method: "GET",
        headers: { "Authorization": "Bearer " + access_token }
    }).then(response => response.json())
]).then(([todayData, lastWeekData]) => {
    // Combine the results
    const combinedData = [...todayData["activities-steps"], ...lastWeekData["activities-steps"]];

    // Generate CSV
    const csvData = generateCsv(combinedData);

    // Print to console
    console.log(csvData);

    // Create a Blob with the CSV data
    const blob = new Blob([csvData], { type: 'text/csv' });

    // Create a download link for the CSV file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'combined_steps.csv';

    // Trigger the download
    a.click();

    // Release the URL object
    window.URL.revokeObjectURL(url);
}).catch(error => console.error(error));
