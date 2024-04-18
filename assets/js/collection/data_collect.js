//data_collect.js

async function getPlannedActivities(user_id) {
    try {
        const response = await fetch(`/admin/api/planned_activities/${user_id}`);
        const data = await response.json();

        if (data.success) {
            const plannedActivities = data.plannedActivities;
            return plannedActivities;
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
            alert("There is no data for this participant");
            return;
        }

        const combinedData = data.data;
        let csvData = 'participant_number,date,day_of_week,planned,start_time,activity_name,total_steps,distance,duration(minutes),calories_burned,points\n';
        let lastSaturdayOutsideLoop;
        let activityMap = new Map();

        // Loop through each combined data item
        combinedData.forEach(item => {
            const date = item.date;


            //Create a list of all the planned activity dates
            let plannedActivityDates = [];
            plannedActivities.forEach(activity => {
                plannedActivityDates.push(activity.startDate);
            });


            // If the date is not in the map, create a new entry
            if (!activityMap.has(date)) {
                activityMap.set(date, []);
            }

            // Loop through each activity for the date
            item.activities.forEach(activity => {
                const formattedParticipantNumber = participantNumber.toString().padStart(2, '0'); // Pad with leading zeros
                const dayOfWeekIndex = new Date(date).getDay(); // Get the day of the week as an index (0-6)
                const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayOfWeek = daysOfWeek[(dayOfWeekIndex + 1) % 7]; // Get the day of the week as a string, with an offset of one day                
                const isPlanned = plannedActivityDates.includes(date);
                
                const startTime = activity.startTime;
                const activityName = activity.name;
                const totalSteps = activity.steps;
                const distance = activity.distance !== undefined ? activity.distance : "N/A";
                const durationInMinutes = Math.round(activity.duration / 60000 * 100) / 100; // Round to 2 decimal places
                const caloriesBurned = activity.calories;

                // Calculate points based on activity type
                let plannedPoints = 0;
                let unplannedPoints = 0;

                if (isPlanned) {
                    plannedPoints = activityMap.get(date).filter(activity => activity.isPlanned).length < 5 ? 500 : 0;
                }
                // Update the map with the new activity
                activityMap.get(date).push({ isPlanned });

                const totalPoints = plannedPoints + unplannedPoints;

                // Append data to CSV string
                csvData += `sub_${formattedParticipantNumber},${date},${dayOfWeek},${isPlanned},${startTime},${activityName},${totalSteps},${distance},${durationInMinutes},${caloriesBurned},${totalPoints}\n`;
            });
        });

        //filter the data to remove duplicates. remove if the date and activity, start time and duration are the same
        let lines = csvData.split("\n");
        let result = [];
        let headers = lines[0].split(",");
        result.push(headers);
        let unique = {};
        for (let i = 1; i < lines.length; i++) {
            let currentLine = lines[i].split(",");
            let date = currentLine[1];
            let activity = currentLine[5];
            let start = currentLine[4];
            let duration = currentLine[8];
            if (!unique[date + activity + start + duration]) {
                result.push(currentLine);
                unique[date + activity + start + duration] = true;
            }
        }
        csvData = result.join("\n");


        // Generate CSV file
        const blob = new Blob([csvData], { type: 'text/csv' });
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
        console.log(data);

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