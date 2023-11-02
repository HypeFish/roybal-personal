//portal.js

document.addEventListener('DOMContentLoaded', async () => {
    const userIdElement = document.getElementById('user-id');
    const participantNumberElement = document.getElementById('participant-number');

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
            let pointsValueElement = document.getElementById('points-value');
            pointsValueElement.innerText = latestWeekPoints;

            function drawStaminaWheel(value) {
                let ctx = document.getElementById('stamina-chart').getContext('2d');

                let data = {
                    labels: [
                        'Your Points',
                        'Remaining Points'
                    ],
                    datasets: [{
                        label: 'Points',
                        data: [value, 1500 - value],
                        backgroundColor: [
                            //green fill
                            'rgba(124, 252, 0, 1)',
                            //gray
                            'rgba(201, 203, 207, 1)'
                        ],
                        hoverOffset: 4
                    }]

                };

                // Makes a doughnut chart
                let options = {
                    responsive: true,
                    cutout: '80%',
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top', // Position options: 'top', 'bottom', 'left', 'right'
                            labels: {
                                color: 'black',
                                usePointStyle: true, // This will use the point style as the legend marker
                                font: {
                                    size: "20%",
                                    family: 'Montserrat'
                                }
                            }
                        },
                        tooltip: {
                            enabled: true
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    },
                    elements: {
                        arc: {
                            borderWidth: 0
                        },
                    },
                    aspectRatio: 1.7
                };

                new Chart(ctx, {
                    type: 'doughnut',
                    data: data,
                    options: options
                });
            }

            drawStaminaWheel(latestWeekPoints)


            $('#calendar').fullCalendar({
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,basicWeek,basicDay'
                },
                events: data.selectedDays.map(day => {
                    return {
                        title: 'Planned Activity',
                        start: day,
                        color: 'blue'
                    };
                }).concat(data.completedPlannedActivities.map(activity => {
                    return {
                        title: 'Completed Planned Activity',
                        start: activity,
                        color: 'green'
                    };
                })).concat(data.missedPlannedActivities.map(date => {
                    return {
                        title: 'Missed Planned Activity',
                        start: date,
                        color: 'red'
                    };
                })).concat(data.callingDays.map(date => {
                    return {
                        title: 'Call',
                        start: date,
                        color: 'orange'
                    };
                }))
            });

            // Calculate the current week number
            const startDate = new Date(data.selectedDays[0]);
            const today = new Date();
            const weekDiff = Math.floor((today - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1;
            const weekLabels = Array.from({ length: weekDiff }, (_, i) => `Week ${i + 1}`)

            // Reverse the weeklyPointsData.data array
            const reversedData = [...weeklyPointsData.data].reverse();

            // Create a line chart
            const lineChartElement = document.getElementById('line-chart');
            const lineCtx = lineChartElement.getContext('2d');

            new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: weekLabels,
                    datasets: [{
                        label: 'Points for the Week',
                        data: reversedData.map(week => week.points),
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
                            max: 1500,
                            ticks: {
                                stepSize: 300
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Error fetching user data:', error));
});


