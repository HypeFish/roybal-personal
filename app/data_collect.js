// Description: This file is used to collect data from Fitbit API

// Fitbit API client ID
const client_id = "23RCXD"

// Fitbit API access token
const access_token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1JDWEQiLCJzdWIiOiJCUFM1V1EiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJlY2cgcnNldCByb3h5IHJudXQgcnBybyByc2xlIHJjZiByYWN0IHJsb2MgcnJlcyByd2VpIHJociBydGVtIiwiZXhwIjoxNjkzOTcwNjE1LCJpYXQiOjE2OTM5NDE4MTV9.Ws-9kDltFISGUvffNICWR02t8dIswZyGvIawz2N9lBQ"

document.getElementById("generateCsvButton").addEventListener("click", () => {
    // Fetch data from the Fitbit API
    fetch('https://api.fitbit.com/1/user/-/activities/steps/date/today/1y.json', {
        method: "GET",
        headers: { "Authorization": "Bearer " + access_token }
    })
        .then(response => response.json())
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

