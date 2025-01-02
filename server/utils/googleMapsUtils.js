import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Fonction pour calculer le temps de trajet entre deux adresses
export const calculateTravelTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination must be provided');
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;

    console.log('URL:', url);

    const response = await fetch(url);
    const data = await response.json();

    if (data.routes.length > 0) {
        const durationInSeconds = data.routes[0].legs[0].duration.value;
        const durationInMinutes = Math.ceil(durationInSeconds / 60); // Convertir les secondes en minutes
        return durationInMinutes;
    } else {
        throw new Error('No route found');
    }
};

// Fonction pour obtenir les coordonnées géographiques à partir de l'adresse
export const getCoordinates = async (address) => {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
            address: address,
            key: process.env.GOOGLE_MAPS_API_KEY
        }
    });

    if (response.data.status === 'OK') {
        const location = response.data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
    } else {
        throw new Error('Unable to get coordinates');
    }
};