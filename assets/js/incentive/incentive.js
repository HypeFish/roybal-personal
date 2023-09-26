document.getElementById('points').addEventListener('click', function () {
    const pointSelector = document.getElementById('pointSelector');
    const selectedOption = pointSelector.options[pointSelector.selectedIndex];
    const selectedUserID = selectedOption.value;
    const selectedParticipantNumber = selectedOption.getAttribute('data-participant-number');

    generatePointsCSV(selectedUserID, selectedParticipantNumber);
});

async function generatePointsCSV(user_id, participantNumber) {
    try {
        // Fetch planned activities for the user
        const plannedActivities = await getPlannedActivities(user_id);

        // Fetch planned activities for the user, including counts for the current week
        const response = await fetch(`/api/planned_activities/${user_id}`);
        const data = await response.json();

        if (!data.success) {
            console.error('Error:', data.error);
            return;
        }

        const plannedActivityCountThisWeek = data.plannedActivityCountThisWeek;
        const unplannedActivityCountThisWeek = data.unplannedActivityCountThisWeek;

        // Check if user has exceeded planned and unplanned activity limits
        if (plannedActivityCountThisWeek > 4 || unplannedActivityCountThisWeek > 1) {
            alert(`Participant ${participantNumber} has exceeded the activity limits for the week.`);
            return;
        }

        const combinedData = data.data;
        if (combinedData.length === 0 || !combinedData[0].activities || combinedData[0].activities.length === 0) {
            alert("There is no data for this participant");
            return;
        }

        // Calculate points
        let plannedActivityCount = 0;
        let unplannedActivityCount = 0;

        combinedData.forEach(item => {
            const date = item.date;
            const isPlanned = plannedActivities.includes(date);

            if (isPlanned) {
                plannedActivityCount++;
            } else {
                unplannedActivityCount++;
            }
        });

        const totalPoints = (plannedActivityCount * 250) + (unplannedActivityCount * 100);

        alert(`Participant ${participantNumber} earned ${totalPoints} points.`);
    } catch (error) {
        console.error(`Error generating points CSV for user ${user_id}:`, error);
    }
}
