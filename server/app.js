import express from 'express';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { auth } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';
import roadtripRoutes from './routes/roadtripRoutes.js';
import stepRoutes from './routes/stepRoutes.js';
// import stageRoutes from './routes/stageRoutes.js';
// import stopRoutes from './routes/stopRoutes.js';
import accommodationRoutes from './routes/accommodationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import googleMapsRoutes from './routes/googleMapsRoutes.js';
import {connectDB} from './config/db.js';

const app = express();

// Convertir l'URL du module en chemin de fichier
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
connectDB();

//Log des variables d'environnement
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY);
console.log('EMAIL:', process.env.EMAIL);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS
app.use(cors({
  origin: '*', // Vous pouvez restreindre cela à votre domaine spécifique
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Configure le répertoire des vues

// Route pour servir login.html
app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Routes
app.use('/auth', authRoutes);
app.use('/roadtrips', auth, roadtripRoutes);
app.use('/steps', auth, stepRoutes);
// app.use('/stages', auth, stageRoutes);
// app.use('/stops', auth, stopRoutes);
app.use('/accommodations', auth, accommodationRoutes);
app.use('/activities', auth, activityRoutes);
app.use('/gm', auth, googleMapsRoutes);

// Route pour servir index.html
app.get('/home', auth, (req, res) => {
    console.log('Route /home called');
    res.sendFile(path.resolve(path.join(__dirname, '../public/index.html')));
});

// Rediriger vers /home si l'utilisateur est connecté
app.get('/', auth, (req, res) => {
    console.log('Route / called');
    res.redirect('/home');
});

// Route pour vérifier l'état de connexion
app.get('/auth/status', auth, (req, res) => {
    res.json({ isAuthenticated: true });
});

app.get('/autocomplete', async (req, res) => {
    const input = req.query.input;  // Input de l'utilisateur
  
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`, 
        {
          params: {
            input: input,
            key: process.env.GOOGLE_MAPS_API_KEY,
            types: '',  // Filtrer par type, par exemple pour des adresses
          },
        }
      );
  
      res.json(response.data);  // Envoi des résultats au client
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la requête à l\'API Google Places' });
    }
  });


// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});