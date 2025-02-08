/**
 * Vérifie la cohérence des dates/heures de départ et d'arrivée par rapport au temps de trajet.
 * @param {Date} departureDateTime - La date/heure de départ.
 * @param {Date} arrivalDateTime - La date/heure d'arrivée.
 * @param {number} travelTime - Le temps de trajet en minutes.
 * @returns {boolean} - Retourne true si les dates/heures sont cohérentes, sinon false.
 */
export const checkDateTimeConsistency = (departureDateTime, arrivalDateTime, travelTime) => {
    const departure = new Date(departureDateTime);
    const arrival = new Date(arrivalDateTime);
    const travelTimeInMilliseconds = travelTime * 60 * 1000;

    // Calculer la date/heure d'arrivée estimée en ajoutant le temps de trajet à la date/heure de départ
    const estimatedArrival = new Date(departure.getTime() + travelTimeInMilliseconds);

    // Vérifier si la date/heure d'arrivée réelle est cohérente avec la date/heure d'arrivée estimée
    return arrival.getTime() >= estimatedArrival.getTime();
};