//plan.js

async function submitNewEmail() {
    const newEmail = document.getElementById('newEmail').value;

    if (newEmail && newEmail.length > 0 && newEmail.includes('@')) {
        try {
            const response = await fetch('/submit-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: newEmail })
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                // Add any additional handling for success here
            } else {
                if (data.message === 'Email address already exists') {
                    alert('This email address is already registered');
                } else {
                    alert('Error submitting email');
                }
                // Add handling for error here
            }
        } catch (error) {
            console.error('Error:', error);
        }

        document.getElementById('newEmail').value = ''; // Clear the input field after submission
    } else {
        alert('Please enter a valid email address');
    }
}



document.getElementById('newEmail').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default behavior of the Enter key
        submitNewEmail();
    }
});


async function getEmails() {
    try {
        const response = await fetch('/get-emails');
        const data = await response.json();

        if (data.success) {
            const emailSelector = document.getElementById('emailSelector');

            // Clear existing options
            emailSelector.innerHTML = '';

            // Add new options
            data.emails.forEach(email => {
                const option = document.createElement('option');
                option.value = email;
                option.textContent = email;
                emailSelector.appendChild(option);
            });
        } else {
            console.error('Error fetching emails:', data.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call the function to populate the email selector
getEmails();

// Add an event listener to the form submission
document.getElementById('planForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission behavior
    submitPlan(); // Call your function to handle the submission
});

async function submitPlan() {
    const selectedDays = Array.from(document.querySelectorAll('input[name="selectedDays"]:checked')).map(input => input.value);
    const selectedEmail = document.getElementById('emailSelector').value;

    if (selectedDays.length > 0 && selectedEmail) {
        try {
            const response = await fetch('/submit-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: selectedEmail, selectedDays })
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
            } else {
                alert('Error submitting plan');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        alert('Please select at least one day and an email');
    }
}
