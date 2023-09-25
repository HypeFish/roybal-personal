//data_collect.js

let allIDs = [];

async function fetchUserIDs() {
    try {
        const response = await fetch('/api/user_ids');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching user IDs:', error);
        throw error; // Rethrow the error so it can be caught by the caller
    }
}

// Fetch all user IDs
fetchUserIDs()

async function fetchTokens(user_id) {
    try {
        const response = await fetch(`/api/tokens/${user_id}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching tokens:', error);
        throw error; // Rethrow the error so it can be caught by the caller
    }
}

async function getPlannedActivities(user_id) {
    try {
        const response = await fetch(`/api/planned_activities/${user_id}`);
        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function makeFitbitAPICall(user_id, access_token, participantNumber) {
    try {
        const response = await fetch(`/api/collect_data/${user_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            }
        })

        if (response.ok) {
            const data = await response.json();
            return { success: true, data };

        } else if (response.status == 401) {
            // Access token expired, trigger token refresh
            const newAccessToken = await refreshAccessToken(user_id);

            if (newAccessToken) {
                return await makeFitbitAPICall(user_id, newAccessToken, participantNumber);
            } else {
                return { success: false, error: 'Error refreshing access token' };
            }
        } else {
            return { success: false, error: `HTTP error! status: ${response.status}` };
        }
    } catch (error) {
        return { success: false, error: 'Internal server error' };
    }
}


async function generateCSV(user_id, participantNumber) {
    try {
        // Fetch planned activities for the user
        const plannedActivities = await getPlannedActivities(user_id);
        const response = await fetch(`/api/combined_data/${user_id}`);
        const data = await response.json();

        if (!data.success) {
            console.error('Error:', data.error);
            return;
        }

        const combinedData = data.data;
        if (combinedData.length === 0 || !combinedData[0].activities || combinedData[0].activities.length === 0) {
            alert("There is no data for this participant");
            return;
        }

        // Add headers for new columns
        const csvData = 'participant_number,date,day_of_week,planned,start_time,activity_name,total_steps,distance,duration(minutes),calories_burned\n';

        const formattedData = combinedData.flatMap(item => {
            return item.activities.map(activity => {
                const formattedParticipantNumber = participantNumber.toString().padStart(2, '0'); // Pad with leading zeros

                const date = item.date;
                const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }); // Get the day of the week
                const isPlanned = plannedActivities.includes(date);
                // Assuming you have the function activityPlanned that checks your database for planned activities
                const startTime = activity.startTime;
                const activityName = activity.name;
                const totalSteps = activity.steps;
                const distance = activity.distance !== undefined ? activity.distance : "N/A";
                const durationInMinutes = Math.round(activity.duration / 60000 * 100) / 100; // Round to 2 decimal places
                const caloriesBurned = activity.calories;

                return `sub_${formattedParticipantNumber},${date},${dayOfWeek},${isPlanned},${startTime},${activityName},${totalSteps},${distance},${durationInMinutes},${caloriesBurned}`;
            });
        });

        const csvContent = csvData + formattedData.join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitbit_data_participant${participantNumber}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error(`Error generating CSV for user ${user_id}:`, error);
    }
}

document.getElementById('generate-csv').addEventListener('click', function () {
    const participantSelector = document.getElementById('participantSelector');
    const selectedOption = participantSelector.options[participantSelector.selectedIndex];
    const selectedUserID = selectedOption.value;
    const selectedParticipantNumber = selectedOption.getAttribute('data-participant-number');

    generateCSV(selectedUserID, selectedParticipantNumber);
});


async function getParticipants() {
    try {
        const response = await fetch('/api/participants');
        const data = await response.json();

        if (data.success) {
            const participantSelector = document.getElementById('participantSelector');

            // Clear existing options
            participantSelector.innerHTML = '';

            // Inside the getParticipants function after fetching data
            data.data.forEach((participant, index) => {
                const option = document.createElement('option');
                option.value = participant.user_id;
                option.textContent = `Participant ${index + 1}`; // Set the participant number as text
                option.setAttribute('data-participant-number', index + 1); // Add participant number as data attribute
                participantSelector.appendChild(option);
            });

        } else {
            console.error('Error fetching participants:', data.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}


// Call the function to populate the participant selector
getParticipants();
