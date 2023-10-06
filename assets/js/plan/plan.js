//plan.js
async function submitNewContact() {
    const newEmail = document.getElementById('newEmail').value;
    const newPhone = document.getElementById('newPhone').value;
    const participantNumber = document.getElementById('participantNumber').value;

    if (participantNumber === '') {
        alert('Please enter a participant number');
        return;
    }

    if ((newEmail && newEmail.length > 0 && newEmail.includes('@')) || newPhone) {
        try {
            const response = await fetch('/admin/submit-contact', {
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
        const response = await fetch('/admin/get-contacts');
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

            const contactSelector2 = document.getElementById('contactSelector2');

            // Clear existing options
            contactSelector2.innerHTML = '';

            // Add new options
            data.data.forEach(identifier => {
                if (identifier.trim() !== '') {
                    const option = document.createElement('option');
                    option.value = identifier;
                    option.textContent = identifier;
                    contactSelector2.appendChild(option);
                }
            });

        } else {
            console.error('Error fetching contacts:', data.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function submitPlan() {
    const selectedDates = document.getElementById('datePicker').value;
    //add the dates to an array
    const dates = selectedDates.split(',');

    if (selectedDates) {
        const selectedContact = document.getElementById('contactSelector').value;

        try {
            const identifier = selectedContact;

            const response = await fetch('/admin/submit-plan', {
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
        const response = await fetch('/admin/api/plan_activity', {
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

flatpickr("#datePicker2", {
    mode: 'multiple', // Enable multiple date selection
    enable: [
        function(date) {
            // Enable all dates for now, you can add custom logic here later
            return true;
        }
    ],
    dateFormat: "Y-m-d", // Set the date format as needed
});


async function submitHealthContact() {
    const newEmail = document.getElementById('healthEmail').value;
    const newPhone = document.getElementById('healthPhone').value;

    if ((newEmail && newEmail.length > 0 && newEmail.includes('@')) || newPhone) {
        try {
            const response = await fetch('/admin/submit-health-contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ identifier: newEmail || newPhone, identifier_type: newEmail ? 'email' : 'phone'})
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);

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

async function submitCallingPlan() {
    const callingDates = document.getElementById('datePicker2').value;
    const dates = callingDates.split(',');
    const identifier = document.getElementById('contactSelector2').value;

    console.log("hello")
    if (callingDates && identifier) {
        try {
            const response = await fetch('/admin/api/call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ identifier, callingDates: dates })
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

async function deleteContact() {
    const selectedContact = document.getElementById('contactSelector').value;

    try {
        const identifier = selectedContact;

        const response = await fetch('/admin/api/delete-contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ identifier })
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);
        } else {
            alert('Error deleting contact');
        }
    } catch (error) {
        console.error('Error:', error);
    }

    document.getElementById('newEmail').value = '';
    document.getElementById('newPhone').value = '';
    document.getElementById('participantNumber').value = '';
}


async function deleteHealthContact() {
    const selectedContact = document.getElementById('contactSelector').value;

    try {
        const identifier = selectedContact;

        const response = await fetch('/admin/api/delete-health-contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ identifier })
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);
        } else {
            alert('Error deleting contact');
        }
    } catch (error) {
        console.error('Error:', error);
    }

    document.getElementById('newEmail').value = '';
    document.getElementById('newPhone').value = '';
    document.getElementById('participantNumber').value = '';
}


// Call the function to populate the contact selector
getContacts();

document.getElementById('points').addEventListener('click', async function () {
    const pointSelector = document.getElementById('pointSelector');
    const selectedOption = pointSelector.options[pointSelector.selectedIndex];
    const selectedUserID = selectedOption.value;

    const totalPoints = await calculatePoints(selectedUserID);

    const pointsResult = document.getElementById('pointsResult');
    pointsResult.textContent = `Participant ${selectedOption.getAttribute('data-participant-number')} earned ${totalPoints} points.`;
});

// Add an event listener to the form submission
document.getElementById('planForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission behavior
    submitPlan(); // Call your function to handle the submission
});

document.getElementById('addContact').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default form submission behavior
    submitNewContact(); // Call your function to handle the submission
});

document.getElementById('addHealthContact').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default form submission behavior
    submitHealthContact(); // Call your function to handle the submission
});

document.getElementById('planForm2').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission behavior
    submitCallingPlan(); // Call your function to handle the submission
});


document.getElementById('removeContact').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default form submission behavior
    deleteContact(); // Call your function to handle the submission
});

document.getElementById('removeHealthContact').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default form submission behavior
    deleteHealthContact(); // Call your function to handle the submission
});
