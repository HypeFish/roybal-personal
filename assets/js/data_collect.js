
const oauthConfig = {
    clientId: '23RCXD',
    clientSecret: 'f1d4bff3fcafa03e1c92009412224b26',
    redirectUri: 'https://roybal.vercel.app/', // This should match the URI you registered with Fitbit
    authorizationUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    scope: 'location respiratory_rate sleep social oxygen_saturation heartrate weight cardio_fitness settings nutrition temperature profile electrocardiogram activity', // e.g., 'activity heartrate sleep'
};

const authorizationUrl = `${oauthConfig.authorizationUrl}?` +
    `client_id=${oauthConfig.clientId}` +
    `&redirect_uri=${encodeURIComponent(oauthConfig.redirectUri)}` +
    `&scope=${encodeURIComponent(oauthConfig.scope)}` +
    `&response_type=code`;

// Redirect the user to the authorization URL
window.location.href = authorizationUrl;


//TODO: GENERATES THE ACCESS TOKEN INFINITE TIMES, NEED TO FIX THIS




// TODO: NEED TO MAKE IT SO THAT THE ACCESS TOKEN IS STORED IN A COOKIE OR SOMETHING
// TODO: FIND A WAY TO MAKE IT SO THAT THE ACCESS TOKEN IS ONLY GENERATED ONCE AND ONLY GENERATED AGAIN IF IT IS EXPIRED, USING THE REFRESH TOKEN




//data_collect.js

// Fitbit API access token and refresh token
let access_token = "eyJhbGciOiJIUzI1NiJ9..."; // Your initial access token
const refresh_token = "86c00a784dbc6ba492fbc62c73b62d1ec718773aa0a0e313a71eca5606604756";

function refreshAccessToken() {
    return fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic YOUR_BASE64_ENCODED_CLIENT_ID_AND_SECRET' // Replace with your client ID and secret
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
