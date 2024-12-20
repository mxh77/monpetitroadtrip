// public/js/stage.js

import { getCurrentStepId, setCurrentStepId, getCurrentStepType, setCurrentStepType } from './handleGlobals.js';
import { selectStage, createStage, updateStage, deleteStage } from './stage.js';
import { selectStop, createStop, updateStop, deleteStop } from './stop.js';
import { updateUIWithRoadtripData, updateUIWithSelectedElements } from './ui.js';


///Fonction d'affichage de la liste des étapes
export function showStepsList() {
    const mainLeftSection = document.getElementById('main-left-section');
    const mainRightSection = document.getElementById('main-right-section');


    mainLeftSection.innerHTML = `
        <div id="main-left-section-header" class="main-left-section-header d-flex justify-content-between align-items-center">
            <h4>Liste des étapes</h4>
            <div class="button-group">
                <button id="create-stop-btn" class="btn bg-success text-white">
                    <i class="fas fa-flag"></i>
                </button>
                <button id="create-stage-btn" class="btn bg-success text-white">
                    <i class="fas fa-bed"></i>
                </button>
            </div>
        </div>
        <ul id="steps-list">
            <!-- Liste des étapes du roadtrip sélectionné -->
        </ul>
    `;

    // Afficher les stepsd du roadtrip sélectionné
    updateUIWithSelectedElements();

    // Étendre la section main-left-section et masquer main-right-section
    mainLeftSection.classList.remove('expanded');
    mainLeftSection.classList.remove('hidden');
    mainLeftSection.classList.add('expanded');
    mainRightSection.classList.remove('expanded');
    mainRightSection.classList.remove('hidden');
    mainRightSection.classList.add('hidden');

}

export function selectStep(event) {
    console.log('selectStep:', event.currentTarget, "id:", event.currentTarget.dataset.id, "type:", event.currentTarget.dataset.type);

    //Gestion de l'étape sélectionnée
    const stepItems = document.querySelectorAll('#steps-list .nav-item');
    stepItems.forEach(item => item.classList.remove('selected-step'));
    event.currentTarget.classList.add('selected-step');

    // Récupérer l'ID de l'étape sélectionnée
    const stepId = event.currentTarget.dataset.id;
    const stepType = event.currentTarget.dataset.type;
    setCurrentStepId(stepId);
    setCurrentStepType(stepType);

    //En fonction du type du step, on appelle la fonction correspondante (stages ou stops)
    if (stepType === 'stage') {
        selectStage(stepId);
    } else if (stepType === 'stop') {
        selectStop(stepId);
    }
}

// Fonction pour enregistrer un nouveau step
export function createStep(type) {
    const form = document.getElementById('create-step-form');
    const name = form.querySelector(`[name="step-name"]`).value
    console.log("name:", name, "type:", type);

    const endpoint = type === 'stage' ? 'stages' : 'stops';

    //en fonction du type du step, on appelle la fonction correspondante (createStage ou createStop)
    if (type === 'stage') {
        createStage(name);
    } else if (type === 'stop') {
        createStop(name);
    }

    // Réactiver le bouton "Ajouter un arrêt"
    const addStopBtn = document.getElementById('create-stop-btn');
    addStopBtn.disabled = false;

    // Réactiver le bouton "Ajouter une étape"
    const addStageBtn = document.getElementById('create-stage-btn');
    addStageBtn.disabled = false;
}

export function updateStep() {

    if (!getCurrentStepId()) {
        console.error('No stage selected');
        return;
    }

    //en fonction du type du step, on appelle la fonction correspondante (updateStage ou updateStop)
    let updatePromise;
    if (getCurrentStepType() === 'stage') {
        console.log('updateStage:', getCurrentStepId());
        updatePromise = updateStage(getCurrentStepId());
    } else if (getCurrentStepType() === 'stop') {
        console.log('updateStop:', getCurrentStepId());
        updatePromise = updateStop(getCurrentStepId());
    }

    // Mettre à jour l'interface utilisateur avec les éléments sélectionnés après la mise à jour du step
    updatePromise.then(() => {
        updateUIWithSelectedElements();
    }).catch(error => {
        console.error('Error updating step:', error);
    });
}

// Fonction pour la confirmation de suppression d'un step
export function deleteStep() {
    //En fonction du type du step, on appelle la fonction correspondante (confirmDeleteStage ou confirmDeleteStop)
    if (getCurrentStepType() === 'stage') {
        deleteStage(getCurrentStepId());
    } else if (getCurrentStepType() === 'stop') {
        deleteStop(getCurrentStepId());
    }
}

// Fonction pour afficher le formulaire de création d'étape
export function showCreateStepForm(type) {
    console.log('showCreateStepForm:', type);
    const stepsList = document.getElementById('steps-list');
    const newStepForm = document.createElement('div');
    const label = type === 'stage' ? "Nom de l'étape" : "Nom de l'arrêt";
    newStepForm.innerHTML = `
        <form id="create-step-form">
            <div class="form-group d-flex align-items-center">
                <label for="step-name" class="col-form-label mr-2">${label}</label>
                <input type="text" class="form-control flex-grow-1" id="step-name" name="step-name">
            </div>
            <button type="button" class="btn btn-success" id="save-step-btn">Enregistrer</button>
            <button type="button" class="btn btn-danger" id="cancel-step-btn">Annuler</button>
        </form>
    `;
    stepsList.appendChild(newStepForm);

    // Désactiver le bouton "Ajouter un arrêt"
    const addStopBtn = document.getElementById('create-stop-btn');
    addStopBtn.disabled = true;

    // Désactiver le bouton "Ajouter une étape"
    const addStageBtn = document.getElementById('create-stage-btn');
    addStageBtn.disabled = true;

    // Ajouter un gestionnaire d'événements pour le bouton "Enregistrer"
    document.getElementById('save-step-btn').addEventListener('click', () => createStep(type));

    // Ajouter un gestionnaire d'événements pour le bouton "Annuler"
    document.getElementById('cancel-step-btn').addEventListener('click', cancelStep);

    console.log('Form added to the DOM');

}

// Fonction pour annuler la création d'une étape
export function cancelStep() {
    const form = document.getElementById('create-step-form');
    if (form) {
        form.parentElement.remove();

        // Réactiver le bouton "Ajouter un arrêt"
        const addStopBtn = document.getElementById('create-stop-btn');
        addStopBtn.disabled = false;

        // Réactiver le bouton "Ajouter une étape"
        const addStageBtn = document.getElementById('create-stage-btn');
        addStageBtn.disabled = false;
    }
}