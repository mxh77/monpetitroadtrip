import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Fonction pour obtenir les coordonnées géographiques à partir de l'adresse
export const getCoordinates = async (address) => {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
            address: address,
            key: GOOGLE_MAPS_API_KEY
        }
    });

    if (response.data.status === 'OK') {
        const location = response.data.results[0].geometry.location;
        return `${location.lat} ${location.lng}`;
    } else {
        throw new Error('No coordinates found for address');
    }
};

// Fonction pour calculer le temps de trajet entre deux adresses
export const calculateTravelTime = async (origin, destination, departure_time = new Date()) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination must be provided');
    }

    // Convertir la date de départ en timestamp
    const departureTimestamp = Math.floor(new Date(departure_time).getTime() / 1000);
    console.log("   departureTimestamp : " + departureTimestamp);
    // Obtenir les coordonnées géographiques pour l'origine et la destination
    const originCoordinates = await getCoordinates(origin);
    const destinationCoordinates = await getCoordinates(destination);
    const mode = 'driving'; // mode de déplacement
    const trafficModel = 'optimistic';

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(originCoordinates)}&destination=${encodeURIComponent(destinationCoordinates)}&mode=${mode}&departure_time=${departureTimestamp}&traffic_model=${trafficModel}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log(url);

    const response = await axios.get(url);
    const data = response.data;

    if (data.routes.length > 0) {
        const durationInSeconds = data.routes[0].legs[0].duration.value;
        const durationInMinutes = Math.ceil(durationInSeconds / 60); // Convertir les secondes en minutes
        return durationInMinutes;
    } else {
        throw new Error('No route found');
    }
};
