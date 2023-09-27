//plan.js
async function submitNewContact() {
    const newEmail = document.getElementById('newEmail').value;
    const newPhone = document.getElementById('newPhone').value;
    const participantNumber = document.getElementById('participantNumber').value;


    if ((newEmail && newEmail.length > 0 && newEmail.includes('@')) || newPhone) {
        try {
            const response = await fetch('/submit-contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ identifier: newEmail || newPhone, identifier_type: newEmail ? 'email' : 'phone', participantNumber: participantNumber })
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);

                const contactSelector = document.getElementById('contactSelector');
                const option = document.createElement('option');
                option.value = newEmail || newPhone;
                option.textContent = newEmail || newPhone;
                contactSelector.appendChild(option);
            } else {
                if (data.message === 'Contact already exists') {
                    alert('This email address or phone number is already registered');
                } else {
                    alert('Error submitting contact');
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }

        document.getElementById('newEmail').value = '';
        document.getElementById('newPhone').value = '';
        document.getElementById('participantNumber').value = '';
    } else {
        alert('Please enter a valid email address or phone number');
    }
}



async function getContacts() {
    try {
        const response = await fetch('/get-contacts');
        const data = await response.json();

        if (data.success) {
            const contactSelector = document.getElementById('contactSelector');

            // Clear existing options
            contactSelector.innerHTML = '';

            // Add new options
            data.data.forEach(identifier => {
                if (identifier.trim() !== '') {
                    const option = document.createElement('option');
                    option.value = identifier;
                    option.textContent = identifier;
                    contactSelector.appendChild(option);
                }
            });
        } else {
            console.error('Error fetching contacts:', data.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}


// Call the function to populate the contact selector
getContacts();

// Add an event listener to the form submission
document.getElementById('planForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission behavior
    submitPlan(); // Call your function to handle the submission
});

async function submitPlan() {
    const selectedDates = document.getElementById('datePicker').value;
    //add the dates to an array
    const dates = selectedDates.split(',');

    if (selectedDates) {
        const selectedContact = document.getElementById('contactSelector').value;

        try {
            const identifier = selectedContact;

            const response = await fetch('/submit-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ identifier, selectedDays: dates })
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
        alert('Please select at least one date and a contact');
    }
}


async function planActivity(user_id, date) {
    try {
        const response = await fetch('/api/plan_activity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id, date })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error planning activity:', error);
        throw error;
    }
}


flatpickr("#datePicker", {
    mode: 'multiple', // Enable multiple date selection
    enable: [
        function(date) {
            // Enable all dates for now, you can add custom logic here later
            return true;
        }
    ],
    dateFormat: "Y-m-d", // Set the date format as needed
});

