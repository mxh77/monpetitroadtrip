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

export function logout() {
    fetch('/auth/logout')
        .then(response => {
            if (response.ok) {
                window.location.href = '/auth/login'; // Redirige vers la page de login après la déconnexion
            } else {
                console.error('Logout failed');
            }
        })
        .catch(error => console.error('Error:', error));
}