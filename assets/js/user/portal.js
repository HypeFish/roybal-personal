//portal.js

document.addEventListener('DOMContentLoaded', async () => {
    const userIdElement = document.getElementById('user-id');
    const participantNumberElement = document.getElementById('participant-number');

    // Fetch weekly points from backend
    const response = await fetch('/api/get_weekly_points');
    const weeklyPointsData = await response.json();

    // first element of the array is the most recent week
    if (weeklyPointsData.data.length === 0) {
       // If there is no data, set the points to 0
         weeklyPointsData.data.push({points: 0});
    }
    const thisWeekPoints = weeklyPointsData.data[0].points;
    console.log(weeklyPointsData.data);

    // Fetch user data from backend
    fetch('/api/get_user_data')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            userIdElement.innerText = data.user_id;
            participantNumberElement.innerText = data.number;
            let pointsValueElement = document.getElementById('points-value');
            pointsValueElement.innerText = thisWeekPoints;

            function drawStaminaWheel(value) {
                let ctx = document.getElementById('stamina-chart').getContext('2d');

                let data = {
                    labels: [
                        'Your Points',
                        'Remaining Points'
                    ],
                    datasets: [{
                        label: 'Points',
                        data: [value, 2500 - value],
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

            drawStaminaWheel(thisWeekPoints)


            $('#calendar').fullCalendar({
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,basicWeek,basicDay'
                },
                events: data.selectedDays?.map(day => {
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

            // Plot the graph of points over weeks
            let ctx = document.getElementById('line-chart').getContext('2d');

            // get all the weeks that have passed since the first week in the data
            let firstDate = weeklyPointsData.data[weeklyPointsData.data.length - 1].date
            let firstDateObj = new Date(firstDate)
            let today = new Date()
            let weeksPassed = Math.floor((today - firstDateObj) / 604800000)
            let weeks = []
            for (let i = 0; i <= weeksPassed; i++) {
                weeks.push(i)
            }

            // reverse the data so that the most recent week is first
            weeklyPointsData.data.reverse()

            let line_chart = {
                labels: weeks,
                datasets: [{
                    label: 'Points',
                    data: weeklyPointsData.data.map(week => week.points),
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            };

            let options = {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Weeks'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Points'
                        }
                    }
                }
            };


            new Chart(ctx, {
                type: 'line',
                data: line_chart,
                options: options
            });

        })
        .catch(error => console.error('Error fetching user data:', error));
});


