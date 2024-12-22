import axios from 'axios';


// Fonction pour calculer le score de Wilson
function wilsonScore(upvotes, total, confidence = 1.96) {
    console.log('upvotes:', upvotes, 'total:', total, 'confidence:', confidence);
    if (total === 0) return 0;
    const phat = upvotes / total;
    console.log('phat:', phat);
    const term1 = confidence * confidence / (2 * total);
    const sqrtTerm = (phat * (1 - phat) + confidence * confidence / (4 * total)) / total;
    console.log('sqrtTerm:', sqrtTerm);
    const term2 = confidence * Math.sqrt(sqrtTerm);
    const denominator = 1 + confidence * confidence / total;
    const score = (phat + term1 - term2) / denominator;
    console.log('term1:', term1, 'term2:', term2, 'denominator:', denominator, 'Wilson score:', score);

    return score;
}

// Fonction pour calculer la distance entre deux points géographiques (formule de Haversine)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

// Fonction pour convertir les coordonnées en adresse
async function getAddressFromCoordinates(lat, lon) {
    const geocodeResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
            latlng: `${lat},${lon}`,
            key: process.env.GOOGLE_MAPS_API_KEY
        }
    });
    const geocodeData = geocodeResponse.data;
    if (geocodeData.results && geocodeData.results.length > 0) {
        return geocodeData.results[0].formatted_address;
    } else {
        return null;
    }
}

export const getTrailsByAddress = async (req, res) => {
    try {
        const address = req.query.address;
        const radius = req.query.radius || 15000;
        if (!address) {
            return res.status(400).json({ msg: 'Address is required' });
        }

        // Convertir l'adresse en coordonnées
        const geocodeResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
            params: {
                address: address,
                key: process.env.GOOGLE_MAPS_API_KEY
            }
        });

        const geocodeData = geocodeResponse.data;
        if (geocodeData.results && geocodeData.results.length > 0) {
            const location = geocodeData.results[0].geometry.location;
            const lat = location.lat;
            const lon = location.lng;

            // Rechercher les sentiers de randonnée autour des coordonnées
            const trailsResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
                params: {
                    location: `${lat},${lon}`,
                    radius: radius || 15000,
                    type: 'park',
                    keyword: 'trail',
                    key: process.env.GOOGLE_MAPS_API_KEY
                }
            });

            //Filtrer les résultats pour retirer ceux qui ont un type "campground"
            const trailsData = trailsResponse.data;
            trailsData.results = trailsData.results.filter(trail => !trail.types.includes('campground'));

            // Récupérer les avis détaillés pour chaque sentier de randonnée
            const trailsWithDetails = await Promise.all(trailsData.results.map(async trail => {
                const detailsResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
                    params: {
                        place_id: trail.place_id,
                        reviews_sort: 'newest',
                        fields: 'rating,user_ratings_total,reviews',
                        key: process.env.GOOGLE_MAPS_API_KEY
                    }
                });

                const detailsData = detailsResponse.data.result;

                // Calculer la distance entre l'adresse et le sentier de randonnée (arrondie à 1 décimale)
                const distance = Math.round(haversineDistance(lat, lon, trail.geometry.location.lat, trail.geometry.location.lng) * 10) / 10;

                // Convertir les coordonnées du sentier en adresse
                const trailAddress = await getAddressFromCoordinates(trail.geometry.location.lat, trail.geometry.location.lng);

                return { ...trail, ...detailsData, distance, trailAddress };
            }));

            // Calculer la préférence pour chaque résultat en utilisant le score de Wilson, la date des avis et le nombre total d'avis
            const trailsWithPreference = trailsWithDetails.map(trail => {
                const rating = trail.rating || 0;
                const userRatingsTotal = trail.user_ratings_total || 0;
                const upvotes = rating / 5 * userRatingsTotal; // Ajuster le calcul de upvotes
                const recentReviewDate = trail.reviews && trail.reviews.length > 0 ? new Date(trail.reviews[0].time * 1000) : new Date(0);
                const daysSinceLastReview = (new Date() - recentReviewDate) / (1000 * 60 * 60 * 24);
                const recencyFactor = Math.max(1 - daysSinceLastReview / 365, 0); // Donne plus de poids aux avis récents (moins d'un an)
                const preference = wilsonScore(upvotes, userRatingsTotal) * recencyFactor * Math.log(userRatingsTotal + 1); // Ajout du facteur basé sur le nombre total d'avis
                //Arrondir la préférence à 2 décimales
                return { ...trail, preference: Math.round(preference * 1000) / 1000 };
            });

            // Trier les résultats par préférence décroissante
            trailsWithPreference.sort((a, b) => b.preference - a.preference);

            res.json({ results: trailsWithPreference });
        } else {
            res.status(404).json({ msg: 'Address not found' });
        }
    } catch (error) {
        console.error('Error fetching trails:', error);
        res.status(500).send('Server error');
    }
};


export const getDirections = async (req, res) => {
    try {
        const { origin, destination, waypoints } = req.query;
        const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Assurez-vous que votre clé API est stockée dans les variables d'environnement
        const waypointsParam = waypoints ? waypoints.split('|').map(wp => `via:${encodeURIComponent(wp)}`).join('|') : '';
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${waypointsParam}&key=${apiKey}`;

        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Erreur lors de la récupération des directions:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des directions.' });
    }
};
