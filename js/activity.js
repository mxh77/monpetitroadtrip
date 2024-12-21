// public/js/stage.js

import { combineDateAndTime, formatDate, formatTime } from './utils.js';
import { getCurrentRoadtripId, getCurrentStepId } from './handleGlobals.js';
import { updateUIWithSelectedElements } from './ui.js';
import { adjustTextareaHeight } from './ui.js';

let activities = []; // Variable pour stocker la liste des hébergements

export function updateActivitiesList(newActivities) {
    console.log('updateActivitiesList:', newActivities);

    activities = newActivities; // Mettre à jour la variable activities
    const activitiesList = document.getElementById('activities-list');
    activitiesList.innerHTML = ''; // Clear existing list

    //Trier les activités par date de début
    activities.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

    activities.forEach(activity => {
        const listItem = document.createElement('li');
        listItem.dataset.id = activity._id; // Inclure l'_id dans l'attribut data-id
        listItem.dataset.toggle = 'collapse';
        listItem.dataset.target = `#activity-details-${activity._id}`;
        listItem.dataset.ariaExpanded = 'false';
        listItem.dataset.ariaControls = `activity-details-${activity._id}`;
        listItem.classList.add('activity-item', 'd-flex', 'justify-content-between', 'align-items-center');
        listItem.setAttribute('id', `activity-item-${activity._id}`);

        const headerDiv = document.createElement('div');
        headerDiv.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'w-100');
        headerDiv.innerHTML = `
            <div>
                <i class="fas fa-caret-right"></i> ${activity.name}
            </div>
            <i class="fas fa-trash-alt delete-activity-btn" data-id="${activity._id}" id="delete-activity-${activity._id}"></i>
        `;
        listItem.appendChild(headerDiv);

        activitiesList.appendChild(listItem);

        // Ajoutez un formulaire de détails ici
        const detailsContent = document.createElement('div');
        detailsContent.setAttribute('id', `activity-details-${activity._id}`);
        detailsContent.setAttribute('class', `collapse`);
        detailsContent.innerHTML = `
            <form data-id="${activity._id}" class="activity-form">
                <div class="form-group d-flex align-items-center">
                    <label for="activity-name-${activity._id}" class="col-form-label mr-2">Nom</label>
                    <input type="text" class="form-control flex-grow-1" id="activity-name-${activity._id}" name="activity-name" value="${activity.name}">
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="activity-address-${activity._id}" class="col-form-label mr-2">Adresse</label>
                    <div class="position-relative w-100">
                        <div class="d-flex flex-grow-1 align-items-center">
                            <input type="text" class="form-control flex-grow-1 address-autocomplete" data-id="activity-address-${activity._id}" id="activity-address-${activity._id}" name="activity-address" value="${activity.address}">
                            <button type="button" class="btn btn-link ml-2 p-0 open-map-btn" data-address-id="activity-address-${activity._id}">
                                <i class="fas fa-map-marker-alt"></i>
                            </button>
                        </div>
                        <div id="activity-address-${activity._id}-suggestions-list" data-id="activity-address-${activity._id}" class="suggestions-list"></div>
                    </div>
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="activity-website-${activity._id}" class="col-form-label mr-2">Site Web</label>
                    <input type="url" class="form-control flex-grow-1" id="activity-website-${activity._id}" name="activity-website" value="${activity.website}">
                    <button type="button" class="btn btn-link ml-2 p-0 open-url-btn" data-url-id="activity-website-${activity._id}">
                        <i class="fas fa-external-link-alt"></i>
                    </button>                
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="activity-phone-${activity._id}" class="col-form-label mr-2">Téléphone</label>
                    <input type="text" class="form-control flex-grow-1" id="activity-phone-${activity._id}" name="activity-phone" value="${activity.phone}">
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="activity-email-${activity._id}" class="col-form-label mr-2">Mail</label>
                    <input type="email" class="form-control flex-grow-1" id="activity-email-${activity._id}" name="activity-email" value="${activity.email}">
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="activity-reservationNumber-${activity._id}" class="col-form-label mr-2">N° Réservation</label>
                    <input type="text" class="form-control flex-grow-1" id="activity-reservationNumber-${activity._id}" name="activity-reservationNumber" value="${activity.reservationNumber}">
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="activity-start-date-${activity._id}" class="col-form-label mr-2">Date Début</label>
                    <div class="d-flex flex-grow-1">
                        <input type="date" class="form-control date-input mr-2" id="activity-start-date-${activity._id}" name="activity-start-date" value="${formatDate(activity.startDateTime)}">
                        <input type="time" class="form-control time-input" id="activity-start-time-${activity._id}" name="activity-start-time" value="${formatTime(activity.startDateTime)}">
                    </div>
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="activity-end-date-${activity._id}" class="col-form-label mr-2">Date Fin</label>
                    <div class="d-flex flex-grow-1">
                        <input type="date" class="form-control date-input mr-2" id="activity-end-date-${activity._id}" name="activity-end-date" value="${formatDate(activity.endDateTime)}">
                        <input type="time" class="form-control time-input" id="activity-end-time-${activity._id}" name="activity-end-time" value="${formatTime(activity.endDateTime)}">
                    </div>
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="activity-duration-${activity._id}" class="col-form-label mr-2">Durée</label>
                    <div class="d-flex flex-grow-1">
                        <input type="number" class="form-control duration-input" id="activity-duration-${activity._id}" name="activity-duration" value="${activity.duration}">
                            <select class="form-control ml-2 typeduration-select" id="activity-typeDuration-${activity._id}" name="activity-typeDuration">
                                <option value="M" ${activity.typeDuration === 'M' ? 'selected' : ''}>Minutes</option>
                                <option value="H" ${activity.typeDuration === 'H' ? 'selected' : ''}>Heures</option>
                                <option value="J" ${activity.typeDuration === 'J' ? 'selected' : ''}>Jours</option>
                            </select>
                    </div>
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="activity-price-${activity._id}" class="col-form-label mr-2">Prix</label>
                    <input type="number" class="form-control flex-grow-0 price-input" id="activity-price-${activity._id}" name="activity-price" value="${activity.price}">
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="activity-notes-${activity._id}" class="col-form-label mr-2">Notes</label>
                    <textarea class="form-control activity-notes" id="activity-notes-${activity._id}" name="activity-notes">${activity.notes}</textarea>
                </div>
            </form>
        `;
        activitiesList.appendChild(detailsContent);

        // Ajouter un gestionnaire d'événements pour agrandir automatiquement le champ de texte des notes
        const notesTextarea = document.getElementById(`activity-notes-${activity._id}`);
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


export function confirmDeleteActivity(id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette activité ?")) {
        deleteActivity(id);
    }
}

export function deleteActivity(id) {
    fetch(`/activities/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de l\'activité');
            }
            return response.json();
        })
        .then(data => {
            console.log('Activity deleted:', data);

            // Mettre à jour l'interface utilisateur avec les éléments sélectionnés après la mise à jour du step
            updateUIWithSelectedElements();
        })
        .catch(error => {
            console.error('Error deleting activity:', error);
        });
}

export function addActivity() {
    const activitiesList = document.getElementById('activities-list');
    const newActivity = document.createElement('div');
    newActivity.innerHTML = `
        <form class="activity-form">
            <div class="form-group d-flex align-items-center">
                <label for="activity-name" class="col-form-label mr-2">Nom</label>
                <input type="text" class="form-control flex-grow-1" name="activity-name">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="activity-address" class="col-form-label mr-2">Adresse</label>
                <div class="position-relative w-100">
                    <input type="text" class="form-control flex-grow-1 address-autocomplete" data-id="activity-address" name="activity-address">
                    <div id="activity-address-suggestions-list" data-id="activity-address" class="suggestions-list"></div>
                </div>
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="activity-website" class="col-form-label mr-2">Site Web</label>
                <input type="url" class="form-control flex-grow-1" name="activity-website">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="activity-phone" class="col-form-label mr-2">Téléphone</label>
                <input type="text" class="form-control flex-grow-1" name="activity-phone">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="activity-email" class="col-form-label mr-2">Mail</label>
                <input type="email" class="form-control flex-grow-1" name="activity-email">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="activity-reservationNumber" class="col-form-label mr-2">N° Réservation</label>
                <input type="text" class="form-control flex-grow-1" name="activity-reservationNumber">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="activity-confirmation-date" class="col-form-label mr-2">Date Confirmation</label>
                <input type="date" class="form-control flex-grow-1" name="activity-confirmation-date">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="activity-arrival-date" class="col-form-label mr-2">Date Début</label>
                <div class="d-flex flex-grow-1">
                    <input type="date" class="form-control date-input mr-2" name="activity-start-date">
                    <input type="time" class="form-control time-input" name="activity-start-time">
                </div>
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="activity-departure-date" class="col-form-label mr-2">Date Fin</label>
                <div class="d-flex flex-grow-1">
                    <input type="date" class="form-control date-input mr-2" name="activity-end-date">
                    <input type="time" class="form-control time-input" name="activity-end-time">
                </div>
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="activity-duration" class="col-form-label mr-2">Durée</label>
                <div class="d-flex flex-grow-1">
                    <input type="number" class="form-control duration-input" id="activity-duration" name="activity-duration">
                        <select class="form-control ml-2 typeduration-select" id="activity-typeDuration" name="activity-typeDuration">
                            <option value="M">Minutes</option>
                            <option value="H">Heures</option>
                            <option value="J">Jours</option>
                        </select>
                </div>
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="activity-price" class="col-form-label mr-2">Prix</label>
                <input type="number" class="form-control flex-grow-1 price-input" name="activity-price">
            </div>
            <div class="form-group d-flex align-items-center">
                <label for="activity-notes" class="col-form-label mr-2">Notes</label>
                <textarea class="form-control flex-grow-1" name="activity-notes"></textarea>
            </div>
            <button type="button" class="btn btn-success save-activity">Enregistrer</button>
            <button type="button" class="btn btn-secondary cancel-activity">Annuler</button>
        </form>
    `;
    activitiesList.appendChild(newActivity);

    // Désactiver le bouton "+"
    const addActivityBtn = document.getElementById('add-activity');
    addActivityBtn.disabled = true;

    // Ajouter un gestionnaire d'événements pour le bouton "Enregistrer"
    newActivity.querySelector('.save-activity').addEventListener('click', function () {
        const form = newActivity.querySelector('.activity-form');
        const activity = {
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

        // Réactiver le bouton "+" après l'enregistrement
        addActivityBtn.disabled = false;


        // Vérifier si l'action a un ID existant
        if (form.dataset.id) {
            activity._id = form.dataset.id;
            // Mettre à jour l'action existante
            fetch(`/activities/${activity._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(activity)
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Activity updated:', data);
                    // Mettre à jour l'interface utilisateur avec les nouvelles données
                    updateActivitiesList(activities.map(act => act._id === data._id ? data : act));
                })
                .catch(error => {
                    console.error('Error updating activity:', error);
                });
        } else {
            // Créer une nouvelle activité
            if (!getCurrentRoadtripId() || !getCurrentStepId()) {
                console.error('Roadtrip ID or Stage ID is not defined');
                return;
            }
            fetch('/roadtrips/' + getCurrentRoadtripId() + '/stages/' + getCurrentStepId() + '/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(activity)
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Activity created:', data);
                    // Mettre à jour l'interface utilisateur avec les nouvelles données
                    console.log(activities);
                    updateActivitiesList([...activities, data]);
                })
                .catch(error => {
                    console.error('Error creating activity:', error);
                });
        }

        // Supprimer le formulaire après l'enregistrement
        newActivity.remove();
    });

    // Ajouter un gestionnaire d'événements pour le bouton "Annuler"
    newActivity.querySelector('.cancel-activity').addEventListener('click', function () {
        // Supprimer le formulaire de création
        newActivity.remove();

        // Réactiver le bouton "+" après l'annulation
        addActivityBtn.disabled = false;
    });
}



