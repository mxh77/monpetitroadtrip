import config from './config.js';

const express = require('express');
const cookieParser = require('cookie-parser');
const axios = require('axios'); // Importer axios
const path = require('path');
const auth = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const roadtripRoutes = require('./routes/roadtripRoutes');
const stageRoutes = require('./routes/stageRoutes');
const stopRoutes = require('./routes/stopRoutes');
const accommodationRoutes = require('./routes/accommodationRoutes');
const activityRoutes = require('./routes/activityRoutes');
const googleMapsRoutes = require('./routes/googleMapsRoutes');
const connectDB = require('./config/db');

const app = express();

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
//app.use(express.static(path.join(__dirname, '../public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Configure le répertoire des vues

// Routes
app.use('/auth', authRoutes);
app.use('/roadtrips', auth, roadtripRoutes);
app.use('/stages', auth, stageRoutes);
app.use('/stops', auth, stopRoutes);
app.use('/accommodations', auth, accommodationRoutes);
app.use('/activities', auth, activityRoutes);
app.use('/gm', auth, googleMapsRoutes);

// Route pour servir index.html
app.get('/home', auth, (req, res) => {
    console.log('Route /home called');
    res.sendFile(path.join(__dirname, '../public/index.html'));
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

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});