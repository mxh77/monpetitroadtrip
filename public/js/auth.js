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

export function logout() {
    fetch(`${config.backendUrl}/auth/logout`)
        .then(response => {
            if (response.ok) {
                window.location.href = '/auth/login'; // Redirige vers la page de login après la déconnexion
            } else {
                console.error('Logout failed');
            }
        })
        .catch(error => console.error('Error:', error));
}