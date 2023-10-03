//data_collect.js

async function getPlannedActivities(user_id) {
    try {
        const response = await fetch(`/admin/api/planned_activities/${user_id}`);
        const data = await response.json();

        if (data.success) {
            const plannedActivities = data.plannedActivities;
            return plannedActivities.map(activity => activity.startDate);
        }

        return [];
    } catch (error) {
        alert("No data for this participant")
        return [];
    }
}

async function generateCSV(user_id, participantNumber) {
    try {
        // Fetch planned activities for the user
        const plannedActivities = await getPlannedActivities(user_id);
        const response = await fetch(`/admin/api/combined_data/${user_id}`);
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

        let plannedPointsCount = 0;
        let unplannedPointsCount = 0;
        let lastSaturdayOutsideLoop;
        let activityMap = new Map();

        // Add headers for new columns
        const csvData = 'participant_number,date,day_of_week,planned,start_time,activity_name,total_steps,distance,duration(minutes),calories_burned,points\n';

        const formattedData = combinedData.flatMap(item => {
            return item.activities.map(activity => {
                const formattedParticipantNumber = participantNumber.toString().padStart(2, '0'); // Pad with leading zeros

                const date = item.date;
                const dayOfWeekIndex = new Date(date).getDay(); // Get the day of the week as an index (0-6)
                const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayOfWeek = daysOfWeek[(dayOfWeekIndex + 1) % 7]; // Get the day of the week as a string, with an offset of one day                
                let isPlanned = plannedActivities.includes(date);
                const startTime = activity.startTime;
                const activityName = activity.name;
                const totalSteps = activity.steps;
                const distance = activity.distance !== undefined ? activity.distance : "N/A";
                const durationInMinutes = Math.round(activity.duration / 60000 * 100) / 100; // Round to 2 decimal places
                const caloriesBurned = activity.calories;

                // Calculate last Saturday
                const today = new Date(date);
                const lastSaturdayInsideLoop = new Date(today);
                lastSaturdayInsideLoop.setDate(today.getDate() - (today.getDay() + 1) % 7);

                // If the last Saturday is not the same as the last Saturday, reset the counters
                if (lastSaturdayOutsideLoop === undefined) {
                    lastSaturdayOutsideLoop = new Date(lastSaturdayInsideLoop);
                    plannedPointsCount = 0;
                    unplannedPointsCount = 0;
                } else if (lastSaturdayOutsideLoop.getTime() !== lastSaturdayInsideLoop.getTime()) {
                    lastSaturdayOutsideLoop = new Date(lastSaturdayInsideLoop);
                    plannedPointsCount = 0;
                    unplannedPointsCount = 0;
                }

                // Check if the date is already in the map
                if (activityMap.has(date)) {
                    const activitiesOnDate = activityMap.get(date);

                    if (isPlanned && activitiesOnDate.some(activity => activity.isPlanned)) {
                        isPlanned = false; // If there are planned activities on this date, mark the new one as unplanned
                    }

                    activitiesOnDate.push({ isPlanned }); // Add the new activity to the list
                    activityMap.set(date, activitiesOnDate); // Update the map with the updated list
                } else {
                    // If the date is not in the map, create a new entry with the current activity
                    activityMap.set(date, [{ isPlanned }]);
                }

                // Check if points have reached max
                const plannedPoints = plannedPointsCount < 5 && isPlanned ? 400 : 0;
                const unplannedPoints = unplannedPointsCount < 2 && !isPlanned ? 250 : 0;

                // Update counters based on activity type
                if (isPlanned && plannedPoints > 0) {
                    plannedPointsCount++;
                } else if (!isPlanned && unplannedPoints > 0) {
                    unplannedPointsCount++;
                }

                const totalPoints = plannedPoints + unplannedPoints;

                return `sub_${formattedParticipantNumber},${date},${dayOfWeek},${isPlanned},${startTime},${activityName},${totalSteps},${distance},${durationInMinutes},${caloriesBurned},${totalPoints}`;
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
        const response = await fetch('/admin/api/participants');
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