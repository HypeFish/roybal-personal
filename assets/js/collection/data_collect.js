//data_collect.js

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
                const dayOfWeekIndex = new Date(date).getDay(); // Get the day of the week as an index (0-6)
                const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayOfWeek = daysOfWeek[(dayOfWeekIndex + 1) % 7]; // Get the day of the week as a string, with an offset of one day                
                console.log(dayOfWeek)
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

async function getParticipants() {
    try {
        const response = await fetch('/api/participants');
        const data = await response.json();

        if (data.success) {
            const participantSelector = document.getElementById('participantSelector');
            const pointSelector = document.getElementById('pointSelector');

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

            data.data.forEach((participant, index) => {
                const option = document.createElement('option');
                option.value = participant.user_id;
                option.textContent = `Participant ${index + 1}`; // Set the participant number as text
                option.setAttribute('data-participant-number', index + 1); // Add participant number as data attribute
                pointSelector.appendChild(option);
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

document.getElementById('generate-csv').addEventListener('click', function () {
    const participantSelector = document.getElementById('participantSelector');
    const selectedOption = participantSelector.options[participantSelector.selectedIndex];
    const selectedUserID = selectedOption.value;
    const selectedParticipantNumber = selectedOption.getAttribute('data-participant-number');

    generateCSV(selectedUserID, selectedParticipantNumber);
});