// Description: This file is used to collect data from Fitbit API

fetch('https://api.fitbit.com/1/user/-/activities/steps/date/today/1y.json', {
    method: "GET",
    headers: {"Authorization": "Bearer " + access_token}
})
.then(response => response.json()) 
.then(json => console.log(json)); 
