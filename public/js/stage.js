// public/js/stage.js

import { updateUIWithStageData } from './ui.js';
import { combineDateAndTime } from './utils.js';
import { updateUIWithSelectedElements } from './ui.js';
import { getCurrentRoadtripId } from './handleGlobals.js';

// Fonction pour gérer la sélection d'une étape
export function selectStage(idStage) {
    console.log('selectStage:', idStage);

    // Récupérer les informations de l'étape
    fetch(`/stages/${idStage}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            // Mettre à jour l'interface utilisateur avec les données de l'étape
            updateUIWithStageData(data);

            // Afficher la section Détail de l'étape
            document.querySelector('.main-right-section').classList.remove('hidden');
            document.querySelector('.main-left-section').classList.remove('expanded');

        })
        .catch(error => {
            console.error('Error fetching stage details:', error);
        });
}

// Fonction pour enregistrer une nouvelle étape
export function createStage(name) {
    const newStage = {
        name: name
    };

    return fetch(`/roadtrips/${getCurrentRoadtripId()}/stages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStage)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Stage created:', data);
            // Mettre à jour l'interface utilisateur avec les nouvelles données
            updateUIWithSelectedElements();
        })
        .catch(error => {
            console.error('Error creating stage:', error);
        });

}

// Fonction pour mettre à jour les informations de l'étape
export function updateStage(idStage) {
    console.log('updateStage:', idStage);
    if (!idStage) {
        console.error('No stage selected');
        return;
    }

    const stageName = document.getElementById('stage-name').value;
    const stageAddress = document.getElementById('stage-address').value;
    const stageArrivalDate = document.getElementById('stage-arrival-date').value;
    const stageArrivalTime = document.getElementById('stage-arrival-time').value;
    const stageDepartureDate = document.getElementById('stage-departure-date').value;
    const stageDepartureTime = document.getElementById('stage-departure-time').value;
    const stageArrivalDateTime = combineDateAndTime(stageArrivalDate, stageArrivalTime);
    const stageDepartureDateTime = combineDateAndTime(stageDepartureDate, stageDepartureTime);
    const stageNights = document.getElementById('stage-nights').value;
    const stageNotes = document.getElementById('stage-notes').value;

    const accommodations = Array.from(document.querySelectorAll('#accommodations-list > div')).map(div => {
        const form = div.querySelector('form');
        return {
            _id: form.dataset.id,
            name: form.querySelector(`[name="accommodation-name"]`).value,
            address: form.querySelector(`[name="accommodation-address"]`).value,
            website: form.querySelector(`[name="accommodation-website"]`).value,
            phone: form.querySelector(`[name="accommodation-phone"]`).value,
            email: form.querySelector(`[name="accommodation-email"]`).value,
            reservationNumber: form.querySelector(`[name="accommodation-reservationNumber"]`).value,
            confirmationDateTime: combineDateAndTime(form.querySelector(`[name="accommodation-confirmation-date"]`).value, '00:00'),
            arrivalDateTime: combineDateAndTime(form.querySelector(`[name="accommodation-arrival-date"]`).value, form.querySelector(`[name="accommodation-arrival-time"]`).value || '00:00'),
            departureDateTime: combineDateAndTime(form.querySelector(`[name="accommodation-departure-date"]`).value, form.querySelector(`[name="accommodation-departure-time"]`).value || '00:00'),
            nights: form.querySelector(`[name="accommodation-nights"]`).value,
            price: form.querySelector(`[name="accommodation-price"]`).value,
            notes: form.querySelector(`[name="accommodation-notes"]`).value
        };
    });

    console.log('accommodations:', accommodations);

    const activities = Array.from(document.querySelectorAll('#activities-list > div')).map(div => {
        const form = div.querySelector('form');
        return {
            _id: form.dataset.id,
            name: form.querySelector(`[name="activity-name"]`).value,
            address: form.querySelector(`[name="activity-address"]`).value,
            website: form.querySelector(`[name="activity-website"]`).value,
            phone: form.querySelector(`[name="activity-phone"]`).value,
            email: form.querySelector(`[name="activity-email"]`).value,
            reservationNumber: form.querySelector(`[name="activity-reservationNumber"]`).value,
            startDateTime: combineDateAndTime(form.querySelector(`[name="activity-start-date"]`).value, form.querySelector(`[name="activity-start-time"]`).value || '00:00'),
            endDateTime: combineDateAndTime(form.querySelector(`[name="activity-end-date"]`).value, form.querySelector(`[name="activity-end-time"]`).value || '00:00'),
            duration: form.querySelector(`[name="activity-duration"]`).value,
            typeDuration: form.querySelector(`[name="activity-typeDuration"]`).value,
            price: form.querySelector(`[name="activity-price"]`).value,
            notes: form.querySelector(`[name="activity-notes"]`).value
        };
    });

    const updatedStage = {
        name: stageName,
        address: stageAddress,
        arrivalDateTime: stageArrivalDateTime,
        departureDateTime: stageDepartureDateTime,
        nights: parseInt(stageNights, 10),
        notes: stageNotes,
        accommodations: accommodations,
        activities: activities
    };

    console.log('updatedStage:', updatedStage);

    return fetch(`/stages/${idStage}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedStage)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Stage updated:', data);
        })
        .catch(error => {
            console.error('Error updating stage:', error);
        });
}

// Fonction pour confirmer et supprimer une étape
export function deleteStage(idStage) {
    console.log('deleteStage:', idStage);
    if (confirm("Êtes-vous sûr de vouloir supprimer cette étape ?")) {
        if (!idStage) {
            console.error('No stage selected');
            return;
        }

        return fetch(`/stages/${idStage}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                console.log('Stage deleted:', data);

                // Appeler updateUIWithSelectedElements après la suppression
                updateUIWithSelectedElements();
            })
            .catch(error => {
                console.error('Error deleting stage:', error);
            });
    }
}
