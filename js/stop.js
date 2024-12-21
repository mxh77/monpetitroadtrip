// public/js/stop.js

import { getCurrentRoadtripId } from './handleGlobals.js';
import { updateUIWithStopData } from './ui.js';
import { combineDateAndTime } from './utils.js';
import { updateUIWithSelectedElements } from './ui.js';

// Fonction pour gérer la sélection d'un arrêt
export function selectStop(idStop) {
    fetch(`/stops/${idStop}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            updateUIWithStopData(data);

            document.querySelector('.main-right-section').classList.remove('hidden');
            document.querySelector('.main-left-section').classList.remove('expanded');
        })
        .catch(error => {
            console.error('Error fetching stop details:', error);
        });
}

// Fonction pour enregistrer un nouvel arrêt
export function createStop(name) {
    const newStop = {
        name: name
    };

    return fetch(`/roadtrips/${getCurrentRoadtripId()}/stops`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStop)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Stop created:', data);
            // Mettre à jour l'interface utilisateur avec les nouvelles données
            updateUIWithSelectedElements();
        })
        .catch(error => {
            console.error('Error creating stop:', error);
        });
}

// Fonction pour mettre à jour les informations de l'arrêt
export function updateStop(idStop) {
    console.log('updateStop:', idStop);

    if (!idStop) {
        console.error('No stop selected');
        return;
    }

    const stopName = document.getElementById('stop-name').value;
    const stopAddress = document.getElementById('stop-address').value;
    const stopWebsite = document.getElementById('stop-website').value;
    const stopPhone = document.getElementById('stop-phone').value;
    const stopEmail = document.getElementById('stop-email').value;
    const stopReservationNumber = document.getElementById('stop-reservation-number').value;
    const stopArrivalDate = document.getElementById('stop-arrival-date').value;
    const stopArrivalTime = document.getElementById('stop-arrival-time').value;
    const stopDepartureDate = document.getElementById('stop-departure-date').value;
    const stopDepartureTime = document.getElementById('stop-departure-time').value;
    const stopArrivalDateTime = combineDateAndTime(stopArrivalDate, stopArrivalTime);
    const stopDepartureDateTime = combineDateAndTime(stopDepartureDate, stopDepartureTime);
    const stopDuration = document.getElementById('stop-duration').value;
    const stopTypeDuration = document.getElementById('stop-type-duration').value;
    const stopPrice = document.getElementById('stop-price').value;
    const stopNotes = document.getElementById('stop-notes').value;

    const updatedStop = {
        name: stopName,
        address: stopAddress,
        website: stopWebsite,
        phone: stopPhone,
        email: stopEmail,
        reservationNumber: stopReservationNumber,
        arrivalDateTime: stopArrivalDateTime,
        departureDateTime: stopDepartureDateTime,
        duration: stopDuration,
        typeDuration: stopTypeDuration,
        price: stopPrice,
        notes: stopNotes
    };

    return fetch(`/stops/${idStop}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedStop)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Stop updated:', data);
        })
        .catch(error => {
            console.error('Error updating stop:', error);
        });
}

// Fonction pour confirmer et supprimer un arrêt
export function deleteStop(idStop) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet arrêt ?")) {
        if (!idStop) {
            console.error('No stop selected');
            return;
        }

        fetch(`/stops/${idStop}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                console.log('Stop deleted:', data);
                // Appeler updateUIWithSelectedElements après la suppression
                updateUIWithSelectedElements();
            })
            .catch(error => {
                console.error('Error deleting stop:', error);
            });
    }
}