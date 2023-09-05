// Description: This file is used to collect data from Fitbit API

import fetch from 'node-fetch';
import { parse } from 'json2csv';

// Your Fitbit access token and API endpoint
const access_token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1JDWEQiLCJzdWIiOiJCUFM1V1EiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJlY2cgcnNldCByb3h5IHJudXQgcnBybyByc2xlIHJjZiByYWN0IHJsb2MgcnJlcyByd2VpIHJociBydGVtIiwiZXhwIjoxNjkzOTcwNjE1LCJpYXQiOjE2OTM5NDE4MTV9.Ws-9kDltFISGUvffNICWR02t8dIswZyGvIawz2N9lBQ"
const apiEndpoint = 'https://api.fitbit.com/1/user/-/activities/steps/date/today/1y.json';

// Fetch the steps data from Fitbit API
fetch(apiEndpoint, {
    method: "GET",
    headers: { "Authorization": "Bearer " + access_token }
})
    .then(response => response.json())
    .then(data => {
        // Convert the JSON data to CSV
        const csv = parse(data['activities-steps']);

        // Save the CSV to a file
        fs.writeFileSync('./data/steps.csv', csv, 'utf8');
        console.log('CSV saved to ./data/steps.csv');
    })
    .catch(error => console.error('Error:', error));



