// public/js/roadtrip.js

import { updateUIWithRoadtripData, updateUIWithSelectedElements } from './ui.js';
import { setCurrentRoadtripId, getCurrentRoadtripId } from './handleGlobals.js';

export function fetchRoadtrips(selectRoadtrip) {
    fetch('/roadtrips', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const roadtripsList = document.getElementById('roadtrips-list');
                roadtripsList.innerHTML = ''; // Clear existing list
                data.forEach(roadtrip => {
                    const listItem = document.createElement('li');
                    listItem.className = 'nav-item nav-link roadtrip-item';
                    listItem.dataset.id = roadtrip._id; // Ajouter l'ID du roadtrip
                    //listItem.innerHTML = `<a class="nav-link " data-id="${roadtrip._id}">${roadtrip.name}</a>`;
                    listItem.innerHTML = roadtrip.name;
                    roadtripsList.appendChild(listItem);
                });

                //Par défaut, on sélectionne le premier roadtrip
                const firstRoadtrip = document.querySelector('#roadtrips-list .roadtrip-item');
                console.log('firstRoadtrip:', firstRoadtrip);
                if (firstRoadtrip) {
                    firstRoadtrip.click();
                }
            } else {
                console.log('No roadtrips found');
            }
        })
        .catch(error => {
            console.error('Error fetching roadtrips:', error);
        });
}

export function selectRoadtrip(event) {
    console.log('selectRoadtrip:', event);

    // Récupération de tous les éléments roadtrip-item
    const roadtripItems = document.querySelectorAll('.roadtrip-item');
    // Suppression de la classe selected-roadtrip pour tous les éléments roadtrip-item
    roadtripItems.forEach(item => item.classList.remove('selected-roadtrip'));
    // Ajout de la classe selected-roadtrip à l'élément cliqué
    event.currentTarget.classList.add('selected-roadtrip');


    // Récupérer l'ID du roadtrip sélectionné
    const roadtripId = event.currentTarget.dataset.id;
    setCurrentRoadtripId(roadtripId);

    // Récupérer les informations du roadtrip
    return fetch(`/roadtrips/${getCurrentRoadtripId()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            //console.log('Roadtrip data:', data); // Debug

            // Mettre à jour l'interface utilisateur avec les données du roadtrip
            updateUIWithRoadtripData(data);

            // Etendre la main-left-section
            const mainLeftSection = document.querySelector('.main-left-section');
            mainLeftSection.classList.add('expanded');
            // Masquer la main-right-section
            const mainRightSection = document.querySelector('.main-right-section');
            mainRightSection.classList.add('hidden');
        })
        .catch(error => {
            console.error('Error fetching roadtrip details:', error);
        });
}