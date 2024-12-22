import { getCurrentRoadtripId } from './handleGlobals.js';

let map;

// Fonction pour initialiser la carte Google Maps
export function initMap() {
    if (!map) {
        map = new google.maps.Map(document.getElementById('googleMaps'), {
            zoom: 6,
            center: { lat: 48.8566, lng: 2.3522 } // Centre initial de la carte (Paris)
        });

        // Forcer le redessin de la carte
        google.maps.event.trigger(map, 'resize');
    }
}

// Assurez-vous que la fonction initMap est accessible globalement
window.initMap = initMap;

// Fonction pour charger dynamiquement le script Google Maps
function loadGoogleMapsScript() {
    return new Promise((resolve, reject) => {
        // Vérifier si le script Google Maps est déjà chargé
        if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBYC-Mamm9LrqrbBPR7jcZ1ZnnwWiRIXQw&callback=initMap&libraries=places&v=${new Date().getTime()}`;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Fonction pour appeler l'API Google Directions via le serveur
async function getDirections(origin, destination, waypoints) {
    const waypointsParam = waypoints.join('|');
    const url = `/gm/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypointsParam)}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Erreur lors de la récupération des directions.');
    }
    const data = await response.json();
    return data;
}

// Fonction pour afficher l'itinéraire sur la carte Google Maps
async function displayItineraryOnMap(segments) {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({ map });

    for (const segment of segments) {
        const request = {
            origin: segment.origin,
            destination: segment.destination,
            waypoints: segment.waypoints.map(address => ({ location: address, stopover: true })),
            travelMode: google.maps.TravelMode.DRIVING
        };

        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
            } else {
                console.error('Erreur lors de la récupération des directions:', status);
            }
        });
    }
}

// Fonction d'affichage de l'itinéraire
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

        // Diviser l'itinéraire en segments de 10 étapes maximum
        const maxSteps = 15;
        const segments = [];
        for (let i = 0; i < steps.length; i += maxSteps - 1) {
            const segmentSteps = steps.slice(i, i + maxSteps);
            const origin = segmentSteps[0].address;
            const destination = segmentSteps[segmentSteps.length - 1].address;
            const waypoints = segmentSteps.slice(1, -1).map(step => step.address);
            segments.push({ origin, destination, waypoints });
        }

        // Supprimer tous les enfants de main-left-section
        const mainLeftSection = document.getElementById('main-left-section');
        while (mainLeftSection.firstChild) {
            mainLeftSection.removeChild(mainLeftSection.firstChild);
        }

        // Créer un div enfant dans la div main-left-section pour afficher la carte
        const googleMapsDiv = document.createElement('div');
        googleMapsDiv.id = 'googleMaps';
        googleMapsDiv.style.height = '500px';
        googleMapsDiv.style.width = '100%';
        mainLeftSection.appendChild(googleMapsDiv);

        // Charger dynamiquement le script Google Maps et initialiser la carte
        await loadGoogleMapsScript();

        // Forcer le redessin de la carte après le chargement du script
        google.maps.event.addListenerOnce(map, 'idle', () => {
            google.maps.event.trigger(map, 'resize');
        });

        // Afficher l'itinéraire sur la carte Google Maps
        displayItineraryOnMap(segments);

    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la récupération des étapes et des arrêts.');
    }
}