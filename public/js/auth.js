// public/js/auth.js
export function checkAuthStatus() {
    return fetch('/auth/status', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (!data.isAuthenticated) {
            window.location.href = '/auth/login';
        }
    })
    .catch(error => {
        console.error('Error checking auth status:', error);
        window.location.href = '/auth/login';
    });
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