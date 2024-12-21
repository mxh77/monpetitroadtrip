// public/js/stage.js

import { combineDateAndTime, formatDate, formatTime } from './utils.js';
import { getCurrentRoadtripId, getCurrentStepId } from './handleGlobals.js';
import { updateUIWithSelectedElements } from './ui.js';
import { adjustTextareaHeight } from './ui.js';

let accommodations = []; // Variable pour stocker la liste des hébergements

// Section pour les fonctions utilitaires
export function updateAccommodationsList(newAccommodations) {
    console.log('updateAccommodationsList:', newAccommodations);

    accommodations = newAccommodations; // Mettre à jour la variable accommodations

    const accommodationsList = document.getElementById('accommodations-list');
    accommodationsList.innerHTML = ''; // Clear existing list

    accommodations.forEach(accommodation => {
        const listItem = document.createElement('li');
        listItem.dataset.id = accommodation._id; // Inclure l'_id dans l'attribut data-id
        listItem.dataset.toggle = 'collapse';
        listItem.dataset.target = `#accommodation-details-${accommodation._id}`;
        listItem.dataset.ariaExpanded = 'false';
        listItem.dataset.ariaControls = `accommodation-details-${accommodation._id}`;
        listItem.classList.add('accommodation-item', 'd-flex', 'justify-content-between', 'align-items-center');
        listItem.setAttribute('id', `accommodation-item-${accommodation._id}`);

        const headerDiv = document.createElement('div');
        headerDiv.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'w-100');
        headerDiv.innerHTML = `
            <div>
                <i class="fas fa-caret-right"></i> ${accommodation.name}
            </div>
            <i class="fas fa-trash-alt delete-accommodation-btn" data-id="${accommodation._id}" id="delete-accommodation-${accommodation._id}"></i>
        `;
        listItem.appendChild(headerDiv);
        accommodationsList.appendChild(listItem);

        // Ajoutez un formulaire de détails ici
        const detailsContent = document.createElement('div');
        detailsContent.setAttribute('id', `accommodation-details-${accommodation._id}`);
        detailsContent.setAttribute('class', `collapse`);
        detailsContent.innerHTML = `
            <form data-id="${accommodation._id}" class="accommodation-form">
                <div class="form-group d-flex align-items-center">
                    <label for="accommodation-name-${accommodation._id}" class="col-form-label mr-2">Nom</label>
                    <input type="text" class="form-control flex-grow-1" id="accommodation-name-${accommodation._id}" name="accommodation-name" value="${accommodation.name}">
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="accommodation-address-${accommodation._id}" class="col-form-label mr-2">Adresse</label>
                    <div class="position-relative w-100">
                        <div class="d-flex flex-grow-1 align-items-center">
                            <input type="text" class="form-control flex-grow-1 address-autocomplete" data-id="accommodation-address-${accommodation._id}" id="accommodation-address-${accommodation._id}" name="accommodation-address" value="${accommodation.address}">
                            <button type="button" class="btn btn-link ml-2 p-0 open-map-btn" data-address-id="accommodation-address-${accommodation._id}">
                                <i class="fas fa-map-marker-alt"></i>
                            </button>
                        </div>
                        <div id="accommodation-address-${accommodation._id}-suggestions-list" data-id="accommodation-address-${accommodation._id}" class="suggestions-list"></div>
                    </div>
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="accommodation-website-${accommodation._id}" class="col-form-label mr-2">Site Web</label>
                    <input type="url" class="form-control flex-grow-1" id="accommodation-website-${accommodation._id}" name="accommodation-website" value="${accommodation.website}">
                    <button type="button" class="btn btn-link ml-2 p-0 open-url-btn" data-url-id="accommodation-website-${accommodation._id}">
                            <i class="fas fa-external-link-alt"></i>
                    </button>
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="accommodation-phone-${accommodation._id}" class="col-form-label mr-2">Téléphone</label>
                    <input type="text" class="form-control flex-grow-1" id="accommodation-phone-${accommodation._id}" name="accommodation-phone" value="${accommodation.phone}">
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="accommodation-email-${accommodation._id}" class="col-form-label mr-2">Mail</label>
                    <input type="email" class="form-control flex-grow-1" id="accommodation-email-${accommodation._id}" name="accommodation-email" value="${accommodation.email}">
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="accommodation-reservationNumber-${accommodation._id}" class="col-form-label mr-2">N° Réservation</label>
                    <input type="text" class="form-control flex-grow-1" id="accommodation-reservationNumber-${accommodation._id}" name="accommodation-reservationNumber" value="${accommodation.reservationNumber}">
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="accommodation-confirmation-date-${accommodation._id}" class="col-form-label mr-2">Date Confirmation</label>
                        <div class="d-flex flex-grow-1">
                            <input type="date" class="form-control date-input" id="accommodation-confirmation-date-${accommodation._id}" name="accommodation-confirmation-date" value="${formatDate(accommodation.confirmationDateTime)}">
                        </div>
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="accommodation-arrival-date-${accommodation._id}" class="col-form-label mr-2">Date Arrivée</label>
                    <div class="d-flex flex-grow-1">
                        <input type="date" class="form-control date-input mr-2" id="accommodation-arrival-date-${accommodation._id}" name="accommodation-arrival-date" value="${formatDate(accommodation.arrivalDateTime)}">
                        <input type="time" class="form-control time-input" id="accommodation-arrival-time-${accommodation._id}" name="accommodation-arrival-time" value="${formatTime(accommodation.arrivalDateTime)}">
                    </div>
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="accommodation-departure-date-${accommodation._id}" class="col-form-label mr-2">Date Départ</label>
                    <div class="d-flex flex-grow-1">
                        <input type="date" class="form-control date-input mr-2" id="accommodation-departure-date-${accommodation._id}" name="accommodation-departure-date" value="${formatDate(accommodation.departureDateTime)}">
                        <input type="time" class="form-control time-input" id="accommodation-departure-time-${accommodation._id}" name="accommodation-departure-time" value="${formatTime(accommodation.departureDateTime)}">
                    </div>
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="accommodation-nights-${accommodation._id}" class="col-form-label mr-2">Nombre de nuits</label>
                    <input type="number" class="form-control flex-grow-0 nights-input" id="accommodation-nights-${accommodation._id}" name="accommodation-nights" value="${accommodation.nights}">
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="accommodation-price-${accommodation._id}" class="col-form-label mr-2">Prix</label>
                    <input type="number" class="form-control flex-grow-0 price-input" id="accommodation-price-${accommodation._id}" name="accommodation-price" value="${accommodation.price}">
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="accommodation-notes-${accommodation._id}" class="col-form-label mr-2">Notes</label>
                    <textarea class="form-control accommodation-notes" id="accommodation-notes-${accommodation._id}" name="accommodation-notes">${accommodation.notes}</textarea>
                </div>
            </form>
        `;
        accommodationsList.appendChild(detailsContent);

        // Ajouter un gestionnaire d'événements pour agrandir automatiquement le champ de texte des notes
        const notesTextarea = document.getElementById(`accommodation-notes-${accommodation._id}`);
        notesTextarea.addEventListener('input', () => {
            adjustTextareaHeight(notesTextarea);
        });

        // Utiliser un MutationObserver pour ajuster la hauteur du textarea lorsque l'élément devient visible
        const observer = new MutationObserver(() => {
            if (notesTextarea.offsetParent !== null) {
                adjustTextareaHeight(notesTextarea);
                observer.disconnect();
            }
        });

        observer.observe(detailsContent, { attributes: true, childList: true, subtree: true });

        // Agrandir le champ de texte des notes si du texte est déjà présent
        adjustTextareaHeight(notesTextarea);
    });

}

export function confirmDeleteAccommodation(id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet hébergement ?")) {
        deleteAccommodation(id);
    }
}

export function deleteAccommodation(id) {
    fetch(`/accommodations/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de l\'hébergement');
            }
            return response.json();
        })
        .then(data => {
            console.log('Accommodation deleted:', data);

            // Mettre à jour l'interface utilisateur avec les éléments sélectionnés après la mise à jour du step
            updateUIWithSelectedElements();
        })
        .catch(error => {
            console.error('Error deleting accommodation:', error);
        });
}

export function addAccommodation() {
    const accommodationsList = document.getElementById('accommodations-list');

    // Récupérer les dates de l'étape à partir des éléments de formulaire existants
    const stageArrivalDate = document.getElementById('stage-arrival-date').value;
    const stageArrivalTime = document.getElementById('stage-arrival-time').value;
    const stageDepartureDate = document.getElementById('stage-departure-date').value;
    const stageDepartureTime = document.getElementById('stage-departure-time').value;

    const newAccommodation = document.createElement('div');
    newAccommodation.innerHTML = `
        <form class="accommodation-form">
            <div class="form-group d-flex align-items-center">
                <label for="accommodation-name" class="col-form-label mr-2">Nom</label>
                <input type="text" class="form-control flex-grow-1" name="accommodation-name">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="accommodation-address" class="col-form-label mr-2">Adresse</label>
                <div class="position-relative w-100">
                    <input type="text" class="form-control flex-grow-1 address-autocomplete" data-id="accommodation-address" name="accommodation-address">
                    <div id="accommodation-address-suggestions-list" data-id="accommodation-address" class="suggestions-list"></div>
                </div>
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="accommodation-website" class="col-form-label mr-2">Site Web</label>
                <input type="url" class="form-control flex-grow-1" name="accommodation-website">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="accommodation-phone" class="col-form-label mr-2">Téléphone</label>
                <input type="text" class="form-control flex-grow-1" name="accommodation-phone">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="accommodation-email" class="col-form-label mr-2">Mail</label>
                <input type="email" class="form-control flex-grow-1" name="accommodation-email">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="accommodation-reservationNumber" class="col-form-label mr-2">N° Réservation</label>
                <input type="text" class="form-control flex-grow-1" name="accommodation-reservationNumber">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="accommodation-confirmation-date" class="col-form-label mr-2">Date Confirmation</label>
                <input type="date" class="form-control flex-grow-1" name="accommodation-confirmation-date">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="accommodation-arrival-date" class="col-form-label mr-2">Date Arrivée</label>
                <div class="d-flex flex-grow-1">
                    <input type="date" class="form-control date-input mr-2" name="accommodation-arrival-date" value="${stageArrivalDate}">
                    <input type="time" class="form-control time-input" name="accommodation-arrival-time" value="${stageArrivalTime}">
                </div>
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="accommodation-departure-date" class="col-form-label mr-2">Date Départ</label>
                <div class="d-flex flex-grow-1">
                    <input type="date" class="form-control date-input mr-2" name="accommodation-departure-date" value="${stageDepartureDate}">
                    <input type="time" class="form-control time-input" name="accommodation-departure-time" value="${stageDepartureTime}">
                </div>
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="accommodation-nights" class="col-form-label mr-2">Nombre de nuits</label>
                <input type="number" class="form-control flex-grow-0 nights-input" name="accommodation-nights">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="accommodation-price" class="col-form-label mr-2">Prix</label>
                <input type="number" class="form-control flex-grow-1" name="accommodation-price">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="accommodation-notes" class="col-form-label mr-2">Notes</label>
                <textarea class="form-control flex-grow-1" name="accommodation-notes"></textarea>
            </div>
            <button type="button" class="btn btn-success save-accommodation">Enregistrer</button>
            <button type="button" class="btn btn-secondary cancel-accommodation">Annuler</button>
        </form>
    `;
    accommodationsList.appendChild(newAccommodation);

    // Désactiver le bouton "+"
    const addAccommodationBtn = document.getElementById('add-accommodation');
    addAccommodationBtn.disabled = true;

    // Ajouter un gestionnaire d'événements pour le bouton "Enregistrer"
    newAccommodation.querySelector('.save-accommodation').addEventListener('click', function () {
        const form = newAccommodation.querySelector('.accommodation-form');
        const accommodation = {
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

        // Réactiver le bouton "+" après l'enregistrement
        addAccommodationBtn.disabled = false;

        // Vérifier si l'hébergement a un ID existant
        if (form.dataset.id) {
            accommodation._id = form.dataset.id;
            // Mettre à jour l'hébergement existant
            fetch(`/accommodations/${accommodation._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(accommodation)
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Accommodation updated:', data);
                    // Mettre à jour l'interface utilisateur avec les nouvelles données
                    updateAccommodationsList(accommodations.map(acc => acc._id === data._id ? data : acc));
                })
                .catch(error => {
                    console.error('Error updating accommodation:', error);
                });
        } else {
            // Créer un nouvel hébergement
            if (!getCurrentRoadtripId() || !getCurrentStepId()) {
                console.error('Roadtrip ID or Stage ID is not defined');
                return;
            }
            fetch('/roadtrips/' + getCurrentRoadtripId() + '/stages/' + getCurrentStepId() + '/accommodations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(accommodation)
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Accommodation created:', data);
                    // Mettre à jour l'interface utilisateur avec les nouvelles données
                    console.log(accommodations);
                    updateAccommodationsList([...accommodations, data]);
                })
                .catch(error => {
                    console.error('Error creating accommodation:', error);
                });
        }

        // Supprimer le formulaire après l'enregistrement
        newAccommodation.remove();
    });

    // Ajouter un gestionnaire d'événements pour le bouton "Annuler"
    newAccommodation.querySelector('.cancel-accommodation').addEventListener('click', function () {
        // Supprimer le formulaire de création
        newAccommodation.remove();

        // Réactiver le bouton "+" après l'annulation
        addAccommodationBtn.disabled = false;
    });

}



