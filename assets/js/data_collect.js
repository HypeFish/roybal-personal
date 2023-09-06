
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


// Fitbit API access token
const access_token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1JDWEQiLCJzdWIiOiJCUFM1V1EiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJlY2cgcnNldCByb3h5IHJwcm8gcm51dCByc2xlIHJjZiByYWN0IHJsb2MgcnJlcyByd2VpIHJociBydGVtIiwiZXhwIjoxNjk0MDU4NTU3LCJpYXQiOjE2OTQwMjk3NTd9.02xpzH8es-xtSlI17-0sBgsHpdE4uVO7TCWu2bF5JTk"

document.getElementById("generateCsvButton").addEventListener("click", () => {
    // Fetch data from the Fitbit API
    //can use a - or "BPS5WQ" for me
    fetch('https://api.fitbit.com/1/user/-/activities/steps/date/today/7d.json', {
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

