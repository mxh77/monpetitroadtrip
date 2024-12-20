const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Fonction pour calculer le temps de trajet entre deux adresses
exports.calculateTravelTime = async (origin, destination) => {
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
}
