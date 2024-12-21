// public/js/utils.js

export function formatDateToLocalInput(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`
    };
}

export function combineDateAndTime(date, time) {
    if (!date || !time) {
        return null; // Retourne null si la date ou l'heure est invalide
    }
    const dateTimeString = `${date}T${time}Z`;
    const dateTime = new Date(dateTimeString);
    if (isNaN(dateTime.getTime())) {
        return null; // Retourne null si la date et l'heure combinées sont invalides
    }
    return dateTime.toISOString();
}

export function formatDate(dateString) {
    if (!dateString) {
        return ''; // Retourne une chaîne vide si la date est nulle
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return ''; // Retourne une chaîne vide si la date est invalide
    }
    // Extraire les composants de la date sans tenir compte du décalage horaire
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Format "yyyy-MM-dd"
}

export function formatTime(dateString) {
    if (!dateString) {
        return ''; // Retourne une chaîne vide si la date est nulle
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return ''; // Retourne une chaîne vide si la date est invalide
    }
    // Extraire les composants de l'heure sans tenir compte du décalage horaire
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`; // Format "HH:mm"
}

export function formatDateTime(dateTime) {
    // Formater la date et l'heure en ISO 8601 sans fuseau horaire
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Fonction pour formater le temps de trajet en HH:MM
export function formatTravelTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}