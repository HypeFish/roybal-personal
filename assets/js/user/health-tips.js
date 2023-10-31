// health-tips.js

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch user data from backend
    fetch('/api/get_user_data')
        .then(response => response.json())
        .then(async data => {
            let userIdElement = document.getElementById('user-id');
            userIdElement.innerText = data.user_id;
            let participantNumberElement = document.getElementById('participant-number');
            participantNumberElement.innerText = data.number;

            $('#calendar').fullCalendar({
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,basicWeek,basicDay'
                },
                events: data.callingDays.map(day => {
                    return {
                        title: 'Calling Day',
                        start: day,
                        color: 'orange'
                    }
                })
            });

            // Get the first tip from the file tips.json in the root directory
            const response = await fetch('/assets/tips.json');
            const tips = await response.json();
            console.log(tips)
            const firstTip = tips.tips[0];
            const tipTitle = document.getElementById('tip-title');
            tipTitle.innerText = firstTip.title;
            const tipDescription = document.getElementById('tip-description');
            tipDescription.innerText = firstTip.description;


        });
});