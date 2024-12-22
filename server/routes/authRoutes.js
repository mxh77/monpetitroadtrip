import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authController from '../controllers/authController.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Route pour afficher le formulaire de connexion
router.get('/login', (req, res) => {
    console.log('Route /auth/login called');
    res.sendFile(path.join(__dirname, '../../public/login.html'));
});

// Route pour la connexion
router.post('/login', authController.login);

// Route pour la déconnexion
router.get('/logout', authController.logout);

// Route pour afficher le formulaire d'inscription
router.get('/register', (req, res) => {
    res.render('register.ejs');
});

// Route pour l'inscription
router.post('/register', authController.register);

// Route pour demander la réinitialisation du mot de passe
router.post('/forgot-password', authController.forgotPassword);

// Route pour réinitialiser le mot de passe
router.post('/reset-password/:token', authController.resetPassword);

// Route GET pour afficher le formulaire de réinitialisation du mot de passe
router.get('/reset-password/:token', (req, res) => {
    res.send(`
        <form action="/auth/reset-password/${req.params.token}" method="POST">
            <input type="hidden" name="token" value="${req.params.token}" />
            <input type="password" name="password" placeholder="New Password" required />
            <button type="submit">Reset Password</button>
        </form>
    `);
});

export default router;