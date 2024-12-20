//Fichier de gestion de l'itinéraire d'un roadtrip
import { getCurrentRoadtripId } from './handleGlobals.js';

//Fonction d'affichage de l'itinéraire
export async function showItinerary() {
    const roadtripId = getCurrentRoadtripId(); // Assurez-vous d'avoir une fonction pour obtenir l'ID du roadtrip courant
    if (!roadtripId) {
        alert('Aucun roadtrip sélectionné.');
        return;
    }

    try {
        const response = await fetch(`/roadtrips/${roadtripId}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des étapes et des arrêts.');
        }
        const roadtrip = await response.json();
        const steps = [...roadtrip.stages, ...roadtrip.stops].sort((a, b) => new Date(a.arrivalDateTime) - new Date(b.arrivalDateTime));

        if (steps.length < 2) {
            alert('Il faut au moins deux étapes pour créer un itinéraire.');
            return;
        }

        // Générer l'URL de Google Maps pour l'itinéraire complet
        const origin = encodeURIComponent(steps[0].address);
        const destination = encodeURIComponent(steps[steps.length - 1].address);
        const waypoints = steps.slice(1, -1).map(step => encodeURIComponent(step.address)).join('|');
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;

        // Ouvrir l'itinéraire dans un nouvel onglet
        window.open(googleMapsUrl, '_blank');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la récupération des étapes et des arrêts.');
    }
}