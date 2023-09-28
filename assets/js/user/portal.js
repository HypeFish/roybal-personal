document.addEventListener('DOMContentLoaded', () => {
    const userIdElement = document.getElementById('user-id');
    const participantNumberElement = document.getElementById('participant-number');
    const plannedActivityDaysElement = document.getElementById('planned-activity-days');
    const completedActivityDaysElement = document.getElementById('completed-activity-days');
    const pointsElement = document.getElementById('points');
    const pointChartElement = document.getElementById('point-chart');

    // Fetch user data from backend
    fetch('/api/get_user_data')
        .then(response => response.json())
        .then(data => {
            userIdElement.innerText = data.user_id;
            participantNumberElement.innerText = data.number;
            plannedActivityDaysElement.innerText = data.selectedDays;
            completedActivityDaysElement.innerText = data.completedPlannedActivities;
            pointsElement.innerText = data.points;

            // Create a chart
            const ctx = pointChartElement.getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Points'],
                    datasets: [{
                        label: 'Points for the Week',
                        data: [data.points],
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 2500
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Error fetching user data:', error));
});
