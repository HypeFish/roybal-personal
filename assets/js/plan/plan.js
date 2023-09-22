async function submitNewContact() {
    const newEmail = document.getElementById('newEmail').value;
    const newPhone = document.getElementById('newPhone').value;

    if ((newEmail && newEmail.length > 0 && newEmail.includes('@')) || newPhone) {
        try {
            const response = await fetch('/submit-contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: newEmail.trim(), phone: newPhone.trim() })
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);

                // After successfully submitting a new contact, add it to the contactSelector
                const contactSelector = document.getElementById('contactSelector');
                const option = document.createElement('option');
                option.value = newEmail || newPhone;
                option.textContent = newEmail || newPhone;
                contactSelector.appendChild(option);

            } else {
                if (data.message === 'Email address already exists' ||
                    data.message === 'Phone number already exists') {
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
            data.data.forEach(contact => {
                if (contact.trim() !== '') {
                    const option = document.createElement('option');
                    option.value = contact;
                    option.textContent = contact;
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
    const selectedDays = Array.from(document.querySelectorAll('input[name="selectedDays"]:checked')).map(input => input.value);
    const selectedContact = document.getElementById('contactSelector').value; // Change to contactSelector

    if (selectedDays.length > 0 && selectedContact) {
        try {
            const response = await fetch('/submit-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ contact: selectedContact, selectedDays }) // Change parameter name to contact
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
        alert('Please select at least one day and a contact');
    }
}

