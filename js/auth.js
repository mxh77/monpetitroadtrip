// public/js/auth.js

export function checkAuthStatus(logoutBtn) {
    fetch('/auth/status')
        .then(response => response.json())
        .then(data => {
            if (data.isAuthenticated) {
                logoutBtn.style.display = 'block';
            }
        })
        .catch(error => console.error('Error:', error));
}