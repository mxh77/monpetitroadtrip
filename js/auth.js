// public/js/auth.js
import config from './config.js';

export function checkAuthStatus(logoutBtn) {
    fetch(`${config.backendUrl}/auth/status`)
        .then(response => response.json())
        .then(data => {
            if (data.isAuthenticated) {
                logoutBtn.style.display = 'block';
            }
        })
        .catch(error => console.error('Error:', error));
}