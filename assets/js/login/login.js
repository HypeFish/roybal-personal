//login.js

document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        // Set flag indicating user is logged in
        localStorage.setItem('isLoggedIn', 'true');
        // Redirect to the home page if login is successful
        window.location.href = '/';
    } else {
        // Display the error message if login is unsuccessful
        const error = await response.json();
        const errorMessageElement = document.querySelector('#error-message');
        errorMessageElement.textContent = error.error;
        errorMessageElement.style.display = 'block'; // Show the error message
    }
});

