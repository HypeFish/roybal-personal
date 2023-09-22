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

        const csvData = 'date,start_time,activity_name,total_steps,distance,duration(minutes),calories_burned\n';

        const formattedData = combinedData.flatMap(item => {
            return item.activities.map(activity => {
                const date = item.date;
                const startTime = activity.startTime;
                const activityName = activity.name;
                const totalSteps = activity.steps;
                const distance = activity.distance !== undefined ? activity.distance : "N/A";
                const durationInMinutes = Math.round(activity.duration / 60000 * 100) / 100; // Round to 2 decimal places
                const caloriesBurned = activity.calories;

                return `${date},${startTime},${activityName},${totalSteps},${distance},${durationInMinutes},${caloriesBurned}`;
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



async function handleButtonClick(user_id, participantNumber) {
    generateCSV(user_id, participantNumber);
}

// Modify your event listener setup like this:
document.getElementById('generate-csv').addEventListener('click', function() {
    const participantSelector = document.getElementById('participant-selector');
    const selectedOption = participantSelector.options[participantSelector.selectedIndex];
    const selectedUserID = selectedOption.value;
    const selectedParticipantNumber = selectedOption.getAttribute('data-participant-number');

    generateCSV(selectedUserID, selectedParticipantNumber);
});


document.getElementById('addParticipant').addEventListener('click', function() {
    const newParticipantID = document.getElementById('newParticipantID').value;

    if (newParticipantID) {
        const participantSelector = document.getElementById('participant-selector');
        const newOption = document.createElement('option');
        const participantNumber = participantSelector.options.length + 1;

        newOption.value = newParticipantID;
        newOption.setAttribute('data-participant-number', participantNumber);
        newOption.textContent = `Participant ${participantNumber}`;
        
        participantSelector.appendChild(newOption);
        document.getElementById('newParticipantID').value = '';

        // Optionally, you can send the new participant data to your server for storage.
        // fetch('/api/add_participant', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         id: newParticipantID,
        //         name: `Participant ${participantNumber}`
        //     })
        // });
    }
});
