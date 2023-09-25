// In your main JavaScript file (e.g., app.js), you can check if the user is already logged in using local storage
document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        // User is already logged in, you can redirect to the home page or perform other actions.
        // For example, you can set a global variable or update the UI to reflect the logged-in state.
        // Redirect to the home page if login is successful
        window.location.href = '/';
    }
});