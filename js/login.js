console.log('login.js loaded');

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const forgotEmail = document.getElementById('forgot-email');
    const forgotPasswordMessage = document.getElementById('forgot-password-message');

    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.redirectTo) {
                        window.location.href = data.redirectTo;
                    } else {
                        errorMessage.textContent = data.msg || 'Login failed';
                        errorMessage.style.display = 'block';
                        console.error('Login failed:', data.msg);
                    }
                })
                .catch(error => {
                    errorMessage.textContent = 'An error occurred. Please try again.';
                    errorMessage.style.display = 'block';
                    console.error('Error:', error);
                });
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function (event) {
            event.preventDefault();
            forgotPasswordForm.style.display = 'block';
        });
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const email = forgotEmail.value;
            console.log('Email entered:', email);

            fetch('/auth/forgot-password', {
            method: 'POST',
                headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        })
            .then(response => {
                console.log('Response status:', response.status);
                return response.json().then(data => ({ status: response.status, body: data }));
            })
            .then(({ status, body }) => {
                console.log('Response body:', body);
                forgotPasswordMessage.style.display = 'block';
                if (status === 200) {
                    forgotPasswordMessage.textContent = 'Le mdail de réinitialisation de votre mot de passe a été envoyé.';
                    forgotPasswordMessage.className = 'text-success mt-3';
                } else {
                    forgotPasswordMessage.textContent = body.msg || 'Une erreur est survenue.';
                    forgotPasswordMessage.className = 'text-danger mt-3';
                    console.error('Forgot password failed:', body.msg);
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                forgotPasswordMessage.style.display = 'block';
                forgotPasswordMessage.textContent = 'Une erreur est survenue. Veuillez réessayer.';
                forgotPasswordMessage.className = 'text-danger mt-3';
            });
    });
    }
});