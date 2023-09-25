//app.js
document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    console.log('isLoggedIn:', isLoggedIn);

    if (isLoggedIn === 'true' && window.location.pathname !== '/') {
        console.log('Redirecting to home page');
        window.location.href = '/';
    }
});

