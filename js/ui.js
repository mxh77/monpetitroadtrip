// public/js/ui.js

//importer util.js
import { formatDate, formatTime, formatTravelTime } from './utils.js';
import { selectRoadtrip } from './roadtrip.js'; // Importer la fonction selectStage
import { selectStep } from './step.js';
import { updateAccommodationsList, addAccommodation } from './accommodation.js'; // Importer la fonction selectStage
import { updateActivitiesList, addActivity } from './activity.js';
import { getCurrentRoadtripId, getCurrentStepId } from './handleGlobals.js';
import { openAddressInGoogleMaps } from './googleMaps.js';

// Définir uniqueDays dans un contexte global
export let uniqueDays = ['Tous'];

//Fontion pour initialiser les sections
export function initializeSections() {
    const roadtripsList = document.getElementById('roadtrips-list');
    const stepsList = document.getElementById('steps-list');
    const mainLeftSection = document.querySelector('.main-left-section');
    const mainRightSection = document.querySelector('.main-right-section');

    if (roadtripsList) {
        const selectedRoadtrip = roadtripsList.querySelector('li.selected');
        if (!selectedRoadtrip) {
            mainRightSection.classList.add('hidden');
            mainLeftSection.classList.add('expanded');
        }
    }

    if (stepsList) {
        const selectedStep = stepsList.querySelector('li.selected');
        if (!selectedStep) {
            mainRightSection.classList.add('hidden');
            mainLeftSection.classList.add('expanded');
        }
    }
}

// Fonction pour mettre à jour l'interface utilisateur avec les éléments sélectionnés (roadtrip, step)
export function updateUIWithSelectedElements() {
    // Resimuler la sélection du roadtrip sélectionné
    const selectedRoadtripElement = document.querySelector(`#roadtrips-list .nav-item[data-id="${getCurrentRoadtripId()}"]`);
    console.log("updateUIWithSelectedElements - selectedRoadtripElement", selectedRoadtripElement);
    if (selectedRoadtripElement) {
        selectRoadtrip({ currentTarget: selectedRoadtripElement })
            .then(() => {
                // Resimuler la sélection du step sélectionné
                const selectedStepElement = document.querySelector(`#steps-list .nav-item[data-id="${getCurrentStepId()}"]`);
                if (selectedStepElement) {
                    //console.log("selectedStepElement", selectedStepElement);
                    selectStep({ currentTarget: selectedStepElement });  // Simulate the selection of the selected step    
                } else {
                    console.error('No step selected');
                    const firstStepElement = document.querySelector(`#steps-list .nav-item`);
                    if (firstStepElement) {
                        selectStep({ currentTarget: firstStepElement });  // Simulate the selection of the first step    
                    } else {
                        console.error('No step found');
                    }
                }
            })
            .catch(error => {
                console.error('Error selecting roadtrip:', error);
            });
    } else {
        console.error('No roadtrip selected');
    }
}

// Fonction pour mettre à jour l'interface utilisateur avec les données du roadtrip
export function updateUIWithRoadtripData(data) {
    //console.log('updateUIWithRoadtripData:', data);
    // Modifier le titre du roadtrip
    const roadtripTitle = document.getElementById('roadtrip-title');
    roadtripTitle.textContent = data.name;

    // Mettre à jour la section main-left-section
    const mainLeftSection = document.getElementById('main-left-section');
    mainLeftSection.innerHTML = `
            <div id="main-left-section-header"
                class="main-left-section-header d-flex justify-content-between align-items-center">
                <h4>Liste des étapes</h4>
                <div class="button-group">
                    <button id="create-stop-btn" class="btn bg-success text-white fas fa-flag">
                    </button>
                    <button id="create-stage-btn" class="btn bg-success text-white fas fa-bed">
                    </button>
                </div>
            </div>
            <ul id="steps-list"></ul>
            <div id="timeline-embed" style="width: 100%; height: 600px;"></div>
        `;

    // Mettre à jour la liste des steps
    const stepsList = document.getElementById('steps-list');
    stepsList.innerHTML = ''; // Clear existing list

    // Ajouter le type aux étapes et aux arrêts
    const stagesWithType = data.stages.map(stage => ({ ...stage, type: 'stage' }));
    const stopsWithType = data.stops.map(stop => ({ ...stop, type: 'stop' }));

    // Combiner et trier les étapes et les arrêts par arrivalDateTime
    const combinedSteps = [...stagesWithType, ...stopsWithType].sort((a, b) => new Date(a.arrivalDateTime) - new Date(b.arrivalDateTime));

    // Extraire les jours uniques
    uniqueDays = ['Tous', ...new Set(combinedSteps.filter(step => step.arrivalDateTime).map(step => new Date(step.arrivalDateTime).toISOString().split('T')[0]))];


    // Afficher les étapes et les arrêts triés
    combinedSteps.forEach((step, index) => {
        // Ajouter le temps de trajet avant chaque étape, sauf la première
        if (index > 0 && step.travelTime) {
            const travelTimeDiv = document.createElement('div');
            travelTimeDiv.className = 'step-travel-time text-muted';
            const origin = encodeURIComponent(combinedSteps[index - 1].address);
            const destination = encodeURIComponent(step.address);
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
            travelTimeDiv.innerHTML = `
                Temps de trajet : ${formatTravelTime(step.travelTime)}
                <a href="${googleMapsUrl}" target="_blank" class="ml-2">
                    <i class="fas fa-directions"></i>
                </a>
            `;
            stepsList.appendChild(travelTimeDiv);
        }

        const listItem = document.createElement('li');
        listItem.className = 'nav-item';
        listItem.dataset.id = step._id; // Ajouter l'ID de l'étape ou de l'arrêt
        listItem.dataset.type = step.type; // Ajouter le type de l'étape ou de l'arrêt
        listItem.dataset.arrivalDateTime = step.arrivalDateTime || ''; // Ajouter l'arrivée de l'étape ou de l'arrêt
        const iconClass = step.type === 'stage' ? 'fa-bed' : 'fa-flag';
        listItem.innerHTML = `
        <a class="nav-link" href="#"><i class="fas ${iconClass}"></i> ${step.name}</a>
        <span class="step-dates text-muted">
            <i>${formatDate(step.arrivalDateTime)} - ${formatDate(step.departureDateTime)}</i>
        </span>
    `;
        listItem.addEventListener('click', selectStep);
        stepsList.appendChild(listItem);
    });

    // Initialiser le sélecteur de jour
    updateDaySelector('Tous');

}

// Fonction pour mettre à jour l'interface utilisateur avec les données de l'étape
export function updateUIWithStageData(data) {
    //console.log('updateUIWithStageData:', data);

    //Mise à jour du titre du step (étape)
    document.getElementById('step-title').textContent = data.name;

    const detailsContainer = document.getElementById('details-container');
    detailsContainer.innerHTML = `
    <ul class="nav flex-column" id="stage-details">
        <li class="nav-link d-flex justify-content-between align-items-center" data-toggle="collapse" data-target="#stage-info-collapse" aria-expanded="false" aria-controls="stage-info-collapse">
            <div>Informations de l'étape</div>
            <div><i class="fas fa-chevron-down"></i></div>
        </li>
        <div class="collapse" id="stage-info-collapse">
            <form id="stage-info-form">
                <div class="form-group d-flex align-items-center">
                    <label for="stage-name" class="col-form-label mr-2">Nom de l'étape</label>
                    <input type="text" class="form-control flex-grow-1" id="stage-name" name="stage-name" value="${data.name}">
                </div>
                <div class="form-group d-flex align-items-center">
                    <label class="col-form-label mr-2">Adresse de l'étape</label>
                    <div class="position-relative w-100">
                        <div class="d-flex flex-grow-1 align-items-center">
                            <input type="text" class="form-control flex-grow-1 address-autocomplete" data-id="stage-address" id="stage-address" value="${data.address}">
                            <button type="button" class="btn btn-link ml-2 p-0 open-map-btn" data-address-id="stage-address">
                                <i class="fas fa-map-marker-alt"></i>
                            </button>
                            <button type="button" class="btn btn-link ml-2 p-0 list-trails-btn" data-address-id="stage-address">
                                <i class="fas fa-hiking"></i>
                            </button>                                     
                        </div>
                        <div id="stage-address-suggestions-list" data-id="stage-address" class="suggestions-list"></div>
                    </div>
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="stage-arrival-date" class="col-form-label mr-2">Date d'arrivée</label>
                    <div class="d-flex flex-grow-1">
                        <input type="date" class="form-control date-input mr-2" id="stage-arrival-date" name="stage-arrival-date" value="${formatDate(data.arrivalDateTime)}">
                        <input type="time" class="form-control time-input" id="stage-arrival-time" name="stage-arrival-time" value="${formatTime(data.arrivalDateTime)}">
                    </div>
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="stage-departure-date" class="col-form-label mr-2">Date de départ</label>
                    <div class="d-flex flex-grow-1">
                        <input type="date" class="form-control date-input mr-2" id="stage-departure-date" name="stage-departure-date" value="${formatDate(data.departureDateTime)}">
                        <input type="time" class="form-control time-input" id="stage-departure-time" name="stage-departure-time" value="${formatTime(data.departureDateTime)}">
                    </div>
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="stage-nights" class="col-form-label mr-2">Nombre de nuits</label>
                    <input type="number" class="form-control flex-grow-0 nights-input" id="stage-nights" name="stage-nights" value="${data.nights}">
                </div>
                <div class="form-group d-flex align-items-center">
                    <label for="stage-notes" class="col-form-label mr-2">Notes</label>
                    <textarea class="form-control flex-grow-1 stage-notes" id="stage-notes" name="stage-notes">${data.notes}</textarea>
                </div>
            </form>
        </div>
        <li id="stage-details-accommodations" class="nav-link">
            <div class="d-flex align-items-center justify-content-between w-100">
                <span class="d-flex align-items-center">
                    <i class="fas fa-bed"></i> Hébergements
                </span>
                <button id="add-accommodation" class="btn btn-primary btn-sm ml-auto">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </li>
        <ul id="accommodations-list" class="nav flex-column"></ul> <!-- Conteneur pour la liste des hébergements -->
        <li id="stage-details-activities" class="nav-link">
            <div class="d-flex align-items-center justify-content-between w-100">
                <span class="d-flex align-items-center">
                    <i class="fas fa-running"></i> Activités
                </span>
                <button id="add-activity" class="btn btn-primary btn-sm ml-auto">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </li>
        <ul id="activities-list"></ul> <!-- Conteneur pour la liste des activités -->
    </ul>
    <div id="trails-container"></div>
    `;

    // Mettre à jour la liste des hébergements
    updateAccommodationsList(data.accommodations);

    // Mettre à jour la liste des activités
    updateActivitiesList(data.activities);

    // Ajouter un gestionnaire d'événements pour le bouton Ajouter un hébergement
    document.getElementById('add-accommodation').addEventListener('click', addAccommodation);

    // Ajouter un gestionnaire d'événements pour le bouton Ajouter une activité
    document.getElementById('add-activity').addEventListener('click', addActivity);

}

// Fonction pour mettre à jour l'interface utilisateur avec les données de l'arrêt
export function updateUIWithStopData(data) {
    //console.log('updateUIWithStopData:', data);

    //Mise à jour du titre du step (étape)
    document.getElementById('step-title').textContent = data.name;

    const detailsContainer = document.getElementById('details-container');
    detailsContainer.innerHTML = `
        <ul class="nav flex-column" id="stop-details">
            <li class="nav-link d-flex justify-content-between align-items-center" data-toggle="collapse" data-target="#stop-info-collapse" aria-expanded="false" aria-controls="stop-info-collapse">
                <div>Informations de l'arrêt</div>
                <div><i class="fas fa-chevron-down"></i></div>
            </li>
            <div class="collapse" id="stop-info-collapse">
                <form id="stop-info-form">
                    <div class="form-group d-flex align-items-center">
                        <label for="stop-name" class="col-form-label mr-2">Nom</label>
                        <input type="text" class="form-control flex-grow-1" id="stop-name" name="stop-name" value="${data.name}">
                    </div>
                    <div class="form-group d-flex align-items-center">
                        <label for="stop-address" class="col-form-label mr-2">Adresse</label>
                        <div class="position-relative w-100">
                            <div class="d-flex flex-grow-1 align-items-center">
                                <input type="text" class="form-control flex-grow-1 address-autocomplete" data-id="stop-address" id="stop-address" value="${data.address}">
                                <button type="button" class="btn btn-link ml-2 p-0 open-map-btn" data-address-id="stop-address">
                                    <i class="fas fa-map-marker-alt"></i>
                                </button>
                                <button type="button" class="btn btn-link ml-2 p-0 list-trails-btn" data-address-id="stop-address">
                                    <i class="fas fa-hiking"></i>
                                </button>                            
                            </div>
                            <div id="stop-address-suggestions-list" data-id="stop-address" class="suggestions-list"></div>
                        </div>
                    </div>
                    <div class="form-group d-flex align-items-center">
                        <label for="stop-website" class="col-form-label mr-2">Site Web</label>
                        <input type="url" class="form-control flex-grow-1" id="stop-website" name="stop-website" value="${data.website}">
                        <button type="button" class="btn btn-link ml-2 p-0 open-url-btn" data-url-id="stop-website">
                                <i class="fas fa-external-link-alt"></i>
                        </button>
                    </div>
                    <div class="form-group d-flex align-items-center">
                        <label for="stop-phone" class="col-form-label mr-2">Téléphone</label>
                        <input type="text" class="form-control flex-grow-1" id="stop-phone" name="stop-phone" value="${data.phone}">
                    </div>
                    <div class="form-group d-flex align-items-center">
                        <label for="stop-email" class="col-form-label mr-2">Mail</label>
                        <input type="email" class="form-control flex-grow-1" id="stop-email" name="stop-email" value="${data.email}">
                    </div>
                    <div class="form-group d-flex align-items-center">
                        <label for="stop-reservation-number" class="col-form-label mr-2">N° Réservation</label>
                        <input type="text" class="form-control flex-grow-1" id="stop-reservation-number" name="stop-reservation-number" value="${data.reservationNumber}">
                    </div>
                    <div class="form-group d-flex align-items-center">
                        <label for="stop-arrival-date" class="col-form-label mr-2">Date Début</label>
                        <div class="d-flex flex-grow-1">
                            <input type="date" class="form-control date-input mr-2" id="stop-arrival-date" name="stop-arrival-date" value="${formatDate(data.arrivalDateTime)}">
                            <input type="time" class="form-control time-input" id="stop-arrival-time" name="stop-arrival-time" value="${formatTime(data.arrivalDateTime)}">
                        </div>
                    </div>
                    <div class="form-group d-flex align-items-center">
                        <label for="stop-departure-date" class="col-form-label mr-2">Date Fin</label>
                        <div class="d-flex flex-grow-1">
                            <input type="date" class="form-control date-input mr-2" id="stop-departure-date" name="stop-departure-date" value="${formatDate(data.departureDateTime)}">
                            <input type="time" class="form-control time-input" id="stop-departure-time" name="stop-departure-time" value="${formatTime(data.departureDateTime)}">
                        </div>
                    </div>
                    <div class="form-group d-flex align-items-center">
                        <label for="stop-duration" class="col-form-label mr-2">Durée</label>
                        <div class="d-flex flex-grow-1">
                            <input type="number" class="form-control duration-input" id="stop-duration" name="stop-duration" value="${data.duration}">
                                <select class="form-control ml-2 typeduration-select" id="stop-type-duration" name="stop-type-duration">
                                    <option value="M" ${data.typeDuration === 'M' ? 'selected' : ''}>Minutes</option>
                                    <option value="H" ${data.typeDuration === 'H' ? 'selected' : ''}>Heures</option>
                                    <option value="J" ${data.typeDuration === 'J' ? 'selected' : ''}>Jours</option>
                                </select>
                        </div>
                    </div>
                    <div class="form-group d-flex align-items-center">
                        <label for="stop-price" class="col-form-label mr-2">Prix</label>
                        <input type="number" class="form-control flex-grow-1" id="stop-price" name="stop-price" value="${data.price}">
                    </div>
                    <div class="form-group d-flex align-items-center">
                        <label for="stop-notes" class="col-form-label mr-2">Notes</label>
                        <textarea class="form-control flex-grow-1" id="stop-notes" name="stop-notes">${data.notes}</textarea>
                    </div>
                </form>
            </div>
        </ul>
        <div id="trails-container"></div>
    `;

}

// Fonction pour ajuster la hauteur des <textarea> en fonction du contenu
export function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}

// Fonction pour gérer l'autocomplétion des champs d'adresse
export async function autocompleteAddressInput(inputElement) {
    console.log('autocompleteAddressInput:', inputElement);
    const input = inputElement.value;
    console.log('input:', input);
    const dataId = inputElement.getAttribute('data-id');
    console.log('dataId:', dataId);
    const suggestionsList = document.querySelector(`.suggestions-list[data-id="${dataId}"]`);
    console.log('suggestionsList:', suggestionsList);

    if (input.length > 0) {  // Launch the request after 3 characters for example
        try {
            const response = await fetch(`/autocomplete?input=${input}`);
            const data = await response.json();

            // Handle suggestions received from the server
            console.log(data); // Display suggestions in the console

            // Display suggestions in the user interface
            suggestionsList.innerHTML = ''; // Clear existing list
            data.predictions.forEach(prediction => {
                const listItem = document.createElement('li');
                listItem.className = 'suggestion-item';
                listItem.textContent = prediction.description;
                listItem.addEventListener('click', () => {
                    inputElement.value = prediction.description;
                    suggestionsList.innerHTML = '';
                    suggestionsList.classList.remove('visible'); // Hide the list after selection
                });
                suggestionsList.appendChild(listItem);
            });

            // Show the suggestions list
            suggestionsList.classList.add('visible');

        } catch (error) {
            console.error('Error fetching data', error);
        }
    } else {
        // Hide the suggestions list if the text is too short
        suggestionsList.innerHTML = '';
        suggestionsList.classList.remove('visible');
    }
}

// Fonction pour mettre à jour le sélecteur de jour
export function updateDaySelector(day) {
    document.getElementById('current-day').textContent = day === 'Tous' ? 'Tous' : formatDate(day);
    filterStepsByDay(day);
}

// Fonction pour filtrer les steps par jour
export function filterStepsByDay(day) {
    const stepsList = document.getElementById('steps-list');
    const steps = stepsList.querySelectorAll('.nav-item');
    steps.forEach(step => {
        const stepDate = step.dataset.arrivalDateTime ? new Date(step.dataset.arrivalDateTime).toISOString().split('T')[0] : '';
        if (day === 'Tous' || stepDate === day) {
            step.style.display = '';
        } else {
            step.style.display = 'none';
        }
    });
}