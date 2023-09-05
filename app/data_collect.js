const access_token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1JDWEQiLCJzdWIiOiJCUFM1V1EiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJlY2cgcnNldCByb3h5IHJudXQgcnBybyByc2xlIHJjZiByYWN0IHJsb2MgcnJlcyByd2VpIHJociBydGVtIiwiZXhwIjoxNjkzOTcwNjE1LCJpYXQiOjE2OTM5NDE4MTV9.Ws-9kDltFISGUvffNICWR02t8dIswZyGvIawz2N9lBQ"

const refresh_token = "0e59641905db8200a78a7ed7ba9d3b656a5f4c974aa019daeac6f66614d84041"

const client_id = "23RCXD"

fetch('https://api.fitbit.com/1/user/-/activities/steps/date/today/1y.json', {
    method: "GET",
    headers: {"Authorization": "Bearer " + access_token}
})
.then(response => response.json()) 
.then(json => console.log(json)); 