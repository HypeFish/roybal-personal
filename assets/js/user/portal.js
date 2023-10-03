//portal.js

document.addEventListener('DOMContentLoaded', async () => {
    const userIdElement = document.getElementById('user-id');
    const participantNumberElement = document.getElementById('participant-number');
    const pointsElement = document.getElementById('points');
    const pointChartElement = document.getElementById('point-chart');

    // Fetch weekly points from backend
    const response = await fetch('/api/get_weekly_points');
    const weeklyPointsData = await response.json();

    // Assuming weeklyPointsData is an array of weekly points objects
    const latestWeekPoints = weeklyPointsData.data[0].points;

    // Fetch user data from backend
    fetch('/api/get_user_data')
        .then(response => response.json())
        .then(data => {
            userIdElement.innerText = data.user_id;
            participantNumberElement.innerText = data.number;
            pointsElement.innerText = latestWeekPoints;

            // Calculate the current week number
            const startDate = new Date(data.selectedDays[0]);
            const today = new Date();
            const weekDiff = Math.floor((today - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1;
            const weekLabels = Array.from({ length: weekDiff }, (_, i) => `Week ${i + 1}`);

            // Create a chart
            const ctx = pointChartElement.getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Points'],
                    datasets: [{
                        label: 'Points for the Week',
                        data: [latestWeekPoints],
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }, {
                        label: 'Max Points for the Week',
                        data: [2500], // Replace with the actual max points value
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
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

            $('#calendar').fullCalendar({
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,basicWeek,basicDay'
                },
                events: data.selectedDays.map(day => {
                    return {
                        title: 'Activity',
                        start: day,
                        color: 'blue'
                    };
                }).concat(data.completedPlannedActivities.map(activity => {
                    return {
                        title: 'Completed Planned Activity',
                        start: activity,
                        color: 'green'
                    };
                })).concat(data.completedUnplannedActivities.map(activity => {
                    return {
                        title: 'Completed Unplanned Activity',
                        start: activity,
                        color: 'orange'
                    };
                })).concat(data.missedPlannedActivities.map(date => {
                    return {
                        title: 'Missed Planned Activity',
                        start: date,
                        color: 'red'
                    };
                }))
            });

            // Create a line chart
            const lineChartElement = document.getElementById('line-chart');
            const lineCtx = lineChartElement.getContext('2d');

            new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: weekLabels,
                    datasets: [{
                        label: 'Points for the Week',
                        data: weeklyPointsData.data.map(week => week.points),
                        fill: false,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        pointRadius: 5,
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)'
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

