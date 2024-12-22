// public/js/main.js

import { checkAuthStatus } from './auth.js';
import { fetchRoadtrips, selectRoadtrip } from './roadtrip.js';
import { showStepsList, updateStep, deleteStep, showCreateStepForm } from './step.js';
import { initializeSections, uniqueDays, updateDaySelector } from './ui.js';
import { autocompleteAddressInput } from './ui.js';
import { confirmDeleteAccommodation } from './accommodation.js';
import { confirmDeleteActivity } from './activity.js';
import { showTimeline } from './timeline.js';
import { showCalendar } from './calendar.js';
import { showGantt } from './gantt.js';
import { showItinerary } from './itinerary.js';
import { fetchReviews, fetchTrails } from './googleMaps.js';


let currentDayIndex = 0;

document.addEventListener('DOMContentLoaded', function () {
    console.log('index.js loaded');

    // Vérifiez l'état d'authentification de l'utilisateur
    checkAuthStatus().then(() => {
        // Initialiser l'état des sections au chargement de la page
        initializeSections();

        // Chargement des roadtrips de l'utilisateur connecté
        fetchRoadtrips(selectRoadtrip);

        // Attacher les gestionnaires d'événements
        initializeClickDelegation();
        initializeInputDelegation();

    });
});

export function logout() {
    // Votre code pour gérer la déconnexion
    fetch('/auth/logout', {
        method: 'GET',
        credentials: 'same-origin'
    })
        .then(response => {
            if (response.ok) {
                window.location.href = '/auth/login';
            } else {
                console.error('Logout failed');
            }
        })
        .catch(error => {
            console.error('Error during logout:', error);
        });
}

// Assurez-vous que la fonction logout est accessible globalement
window.logout = logout;

//Fonction pour intialiser la délégation d'événements pour click sur un élément
export function initializeClickDelegation() {
    document.addEventListener('click', (event) => {

        /********************/
        /* LIST ROADTRIPS */
        /********************/
        // L'élément cliqué est un roadtrip (classe="roadtrip-item")
        if (event.target.classList.contains('roadtrip-item')) {
            console.log('roadtrip-item clicked:', event.target);
            selectRoadtrip({ currentTarget: event.target });
        }

        /********************/
        /* MENU */
        /********************/
        // L'élément cliqué est le double chevron gauche (id="prev-all-days")
        if (event.target.id === 'prev-all-days') {
            currentDayIndex = 0;
            updateDaySelector('Tous');
        }

        // L'élément cliqué est le chevron gauche (id="prev-day")
        if (event.target.id === 'prev-day') {
            if (currentDayIndex > 0) {
                currentDayIndex--;
                updateDaySelector(uniqueDays[currentDayIndex]);
            }
        }

        // L'élément cliqué est le chevron droit (id="next-day")
        if (event.target.id === 'next-day') {
            if (currentDayIndex < uniqueDays.length - 1) {
                currentDayIndex++;
                updateDaySelector(uniqueDays[currentDayIndex]);
            }
        }

        // L'élément cliqué est le bouton "Etapes" (id="steps-button")
        if (event.target.id === 'steps-button') {
            showStepsList();
        }

        // L'élément cliqué est le bouton "Calendrier" (id="calendar-button")
        if (event.target.id === 'calendar-button') {
            showCalendar();
        }

        // L'élément cliqué est le bouton "Timeline" (id="timeline-button")
        if (event.target.id === 'timeline-button') {
            showTimeline();
        }

        // L'élément cliqué est le bouton "Gantt" (id="gantt-button")
        if (event.target.id === 'gantt-button') {
            showGantt();
        }

        // L'élément cliqué est le bouton "Itinéraire" (id="itinerary-button")
        if (event.target.id === 'itinerary-button') {
            showItinerary();
        }


        /********************/
        /* LISTE STEPS */
        /********************/
        // L'élément cliqué est le bouton "Ajouter un stop" (id="create-stop-btn")
        if (event.target.id === 'create-stop-btn') {
            showCreateStepForm('stop');
        }

        // L'élément cliqué est le bouton "Ajouter un stage" (id="create-stage-btn")
        if (event.target.id === 'create-stage-btn') {
            showCreateStepForm('stage');
        }


        /********************/
        /* DETAIL STEP */
        /********************/
        // L'élément cliqué est le bouton "Enregistrer un step" (id="save-step")
        if (event.target.id === 'save-step') {
            updateStep();
        }

        // L'élément cliqué est le bouton "Supprimer un step" (id="delete-step")
        if (event.target.id === 'delete-step') {
            deleteStep();
        }

        // L'élément cliqué est le bouton "Supprimer" d'un hébergement
        if (event.target.classList.contains('delete-accommodation-btn')) {
            confirmDeleteAccommodation(event.target.dataset.id);
        }

        // L'élément cliqué est le bouton "Supprimer" d'une activité
        if (event.target.classList.contains('delete-activity-btn')) {
            confirmDeleteActivity(event.target.dataset.id);
        }

        // L'élément cliqué est le bouton "Ouvrir dans Google Maps"
        if (event.target.classList.contains('open-map-btn') || event.target.closest('.open-map-btn')) {
            const button = event.target.closest('.open-map-btn');
            const addressId = button.getAttribute('data-address-id');
            const addressInput = document.getElementById(addressId);
            const address = addressInput.value;
            if (address) {
                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
                window.open(googleMapsUrl, '_blank');
            } else {
                alert('Veuillez entrer une adresse.');
            }
        }

        // L'élément cliqué est le bouton "Ouvrir l'URL"
        if (event.target.classList.contains('open-url-btn') || event.target.closest('.open-url-btn')) {
            const button = event.target.closest('.open-url-btn');
            const urlId = button.getAttribute('data-url-id');
            const urlInput = document.getElementById(urlId);
            const url = urlInput.value;
            if (url) {
                window.open(url, '_blank');
            }
        }

        // L'élément cliqué est le bouton "Consulter les avis"
        if (event.target.classList.contains('open-reviews-btn') || event.target.closest('.open-reviews-btn')) {
            const button = event.target.closest('.open-reviews-btn');
            const addressId = button.getAttribute('data-address-id');
            const addressInput = document.getElementById(addressId);
            const address = addressInput.value;
            if (address) {
                fetchReviews(address);
            } else {
                alert('Veuillez entrer une adresse.');
            }
        }

        // L'élément cliqué est le bouton "Consulter les trails"
        if (event.target.classList.contains('list-trails-btn') || event.target.closest('.list-trails-btn')) {
            const button = event.target.closest('.list-trails-btn');
            const addressId = button.getAttribute('data-address-id');
            const addressInput = document.getElementById(addressId);
            const address = addressInput.value;
            if (address) {
                fetchTrails(address);
            } else {
                alert('Veuillez entrer une adresse.');
            }
        }

    });
}

//Fonction pour intialiser la délégation d'événements pour les champs input
export function initializeInputDelegation() {
    document.addEventListener('input', (event) => {

        // L'élément concerné est un champ input avec la classe "address-autocomplete"
        if (event.target.classList.contains('address-autocomplete')) {
            autocompleteAddressInput(event.target);
        }
    });
}

