async function calculatePoints(user_id) {
    try {
        const response = await fetch(`/api/planned_activities/${user_id}`);
        const plannedAndUnplanned = await response.json();

        if (plannedAndUnplanned.success) {
            const plannedActivities = plannedAndUnplanned.plannedActivities;
            const unplannedActivities = plannedAndUnplanned.unplannedActivities;

            // Calculate points for planned activities (up to 5)
            // Only check for this week (Saturday to Sunday)
            const today = new Date();
            const saturday = new Date(today.setDate(today.getDate() - today.getDay()));
            const sunday = new Date(today.setDate(today.getDate() - today.getDay() + 6));

            const plannedActivitiesThisWeek = plannedActivities.filter(activity => { 
                const activityDate = new Date(activity.startDate);
                return activityDate >= saturday && activityDate <= sunday;
            });
            const plannedPoints = Math.min(plannedActivitiesThisWeek.length, 5) * 500;

            // Calculate points for unplanned activities (up to 2)
            // Only check for this week (Saturday to Sunday)
            const unplannedActivitiesThisWeek = unplannedActivities.filter(activity => {
                const activityDate = new Date(activity.startDate);
                return activityDate >= saturday && activityDate <= sunday;
            });
            const unplannedPoints = Math.min(unplannedActivitiesThisWeek.length, 2) * 250;

            console.log(unplannedActivitiesThisWeek)
            return plannedPoints + unplannedPoints;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error:', error);
        return 0;
    }
}


document.getElementById('points').addEventListener('click', async function () {
    const pointSelector = document.getElementById('pointSelector');
    const selectedOption = pointSelector.options[pointSelector.selectedIndex];
    const selectedUserID = selectedOption.value;

    const totalPoints = await calculatePoints(selectedUserID);

    const pointsResult = document.getElementById('pointsResult');
    pointsResult.textContent = `Participant ${selectedOption.getAttribute('data-participant-number')} earned ${totalPoints} points.`;
});
