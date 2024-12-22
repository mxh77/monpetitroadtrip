import express from 'express';
import {getDirections, getTrailsByAddress} from '../controllers/googleMapsController.js';

const router = express.Router();
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Route pour obtenir les sentiers de randonnée autour d'une adresse
router.get('/trails', getTrailsByAddress);

// Endpoint pour récupérer les avis liés à une adresse
router.get('/steps/reviews', async (req, res) => {
    const { address } = req.query;
    try {
        // Requête pour obtenir l'ID du lieu
        const urlFindPlace = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(address)}&inputtype=textquery&fields=place_id&key=${GOOGLE_MAPS_API_KEY}`;
        const placeResponse = await fetch(urlFindPlace);
        console.log('urlFindPlace:', urlFindPlace);
        const placeData = await placeResponse.json();
        console.log('placeData:', placeData);
        if (placeData.candidates && placeData.candidates.length > 0) {
            const placeId = placeData.candidates[0].place_id;
            console.log('placeId:', placeId);
            // Requête pour obtenir les avis du lieu
            const urlReviews = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${GOOGLE_MAPS_API_KEY}`;
            const reviewsResponse = await fetch(urlReviews);
            console.log('urlReviews:', urlReviews);

            const reviewsData = await reviewsResponse.json();
            res.json(reviewsData);
        } else {
            res.status(404).json({ message: 'Lieu non trouvé.' });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des avis:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des avis.' });
    }
});

// Route pour obtenir les directions
router.get('/directions', getDirections);

export default router;
