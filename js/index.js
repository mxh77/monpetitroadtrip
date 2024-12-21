/* console.log('index.js loaded');

document.addEventListener('DOMContentLoaded', function () {
    // Afficher le bouton de déconnexion si l'utilisateur est connecté
    const logoutBtn = document.getElementById('logout-btn');
    const roadtripList = document.getElementById('roadtrip-list');
    const stageList = document.getElementById('stage-list');
    const mainLeftSection = document.querySelector('.main-left-section');
    const mainRightSection = document.querySelector('.main-right-section');
    const saveStageIcon = document.getElementById('save-stage');
    let currentStageId = null;

    // Initialiser l'état des sections au chargement de la page
    initializeSections();

    if (logoutBtn) {
        fetch('/auth/status')
            .then(response => response.json())
            .then(data => {
                if (data.isAuthenticated) {
                    logoutBtn.style.display = 'block';
                }
            })
            .catch(error => console.error('Error:', error));
    }

    // Fonction pour gérer la sélection d'un roadtrip
    function selectRoadtrip(event) {
        console.log('Roadtrip selected:', event.currentTarget, "id:", event.currentTarget.dataset.id);

        //Gestion du roadtrip sélectionné
        const roadtripItems = document.querySelectorAll('#roadtrip-list .nav-item');
        roadtripItems.forEach(item => item.classList.remove('selected'));
        event.currentTarget.classList.add('selected');

        // Récupérer l'ID du roadtrip sélectionné
        const roadtripId = event.currentTarget.dataset.id;

        // Récupérer les informations du roadtrip
        fetch(`/roadtrips/${roadtripId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                console.log('Roadtrip data:', data); // Debug

                // Mettre à jour l'interface utilisateur avec les données du roadtrip
                updateUIWithRoadtripData(data);
            })
            .catch(error => {
                console.error('Error fetching roadtrip details:', error);
            });

    }

    //Fonction pour mettre à jour l'interface utilisateur avec les données du roadtrip
    function updateUIWithRoadtripData(data) {
        // Modifier le titre du roadtrip
        const roadtripTitle = document.getElementById('roadtrip-title');
        roadtripTitle.textContent = data.name;

        // Mettre à jour la liste des étapes
        const stageList = document.getElementById('stage-list');
        stageList.innerHTML = ''; // Clear existing list
        data.stages.forEach(stage => {
            const listItem = document.createElement('li');
            listItem.className = 'nav-item';
            listItem.dataset.id = stage._id; // Ajouter l'ID de l'étape
            listItem.innerHTML = `<a class="nav-link" href="#">${stage.name}</a>`;
            listItem.addEventListener('click', selectStage);
            stageList.appendChild(listItem);
        });
    }


    // Fonction pour initialiser l'état des sections
    function initializeSections() {
        const selectedRoadtrip = roadtripList.querySelector('li.selected');
        if (!selectedRoadtrip) {
            mainRightSection.classList.add('hidden');
            mainLeftSection.classList.add('expanded');
        }

        const selectedStage = stageList.querySelector('li.selected');
        if (!selectedStage) {
            mainRightSection.classList.add('hidden');
            mainLeftSection.classList.add('expanded');
        }
    }

    //Fonction pour gérer la sélection d'une étape
    function selectStage(event) {
        console.log('Stage selected:', event.currentTarget, "id:", event.currentTarget.dataset.id);

        //Gestion de l'étape sélectionnée
        const stageItems = document.querySelectorAll('#stage-list .nav-item');
        stageItems.forEach(item => item.classList.remove('selected'));
        event.currentTarget.classList.add('selected');

        // Récupérer l'ID de l'étape sélectionnée
        currentStageId = event.currentTarget.dataset.id;

        // Récupérer les informations de l'étape
        fetch(`/stages/${currentStageId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                // Traiter les données de l'étape
                console.log('Stage data:', data);
                // Mettre à jour l'interface utilisateur avec les données de l'étape
                updateUIWithStageData(data);

                // Afficher la section Détail de l'étape
                mainRightSection.classList.remove('hidden');
                mainLeftSection.classList.remove('expanded');
            })
            .catch(error => {
                console.error('Error fetching stage details:', error);
            });

    }

    // Fonction pour mettre à jour les informations de l'étape
    function updateStage(event) {
        if (!currentStageId) {
            console.error('No stage selected');
            return;
        }

        const stageName = document.getElementById('stage-name').value;
        const stageAddress = document.getElementById('stage-address').value;
        const arrivalDate = document.getElementById('arrival-date').value;
        const arrivalTime = document.getElementById('arrival-time').value;
        const departureDate = document.getElementById('departure-date').value;
        const departureTime = document.getElementById('departure-time').value;
        const nights = document.getElementById('nights').value;
        const notes = document.getElementById('notes').value;

        const updatedStage = {
            name: stageName,
            address: stageAddress,
            arrivalDate: arrivalDate,
            arrivalTime: arrivalTime,
            departureDate: departureDate,
            departureTime: departureTime,
            nights: parseInt(nights, 10),
            notes: notes
        };

        fetch(`/stages/${currentStageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedStage)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Stage updated:', data);
                // Mettre à jour l'interface utilisateur avec les nouvelles données de l'étape
                updateUIWithStageData(data);
            })
            .catch(error => {
                console.error('Error updating stage:', error);
            });
    }

    // Ajouter un gestionnaire d'événements pour l'icône "Enregistrer"
    saveStageIcon.addEventListener('click', updateStage);

    // Fonction pour mettre à jour l'interface utilisateur avec les données de l'étape
    function updateUIWithStageData(data) {
        // Mettre à jour les informations de l'étape
        const stageTitle = document.getElementById('stage-title');
        const stageName = document.getElementById('stage-name');
        const stageAddress = document.getElementById('stage-address');
        const arrivalDate = document.getElementById('arrival-date');
        const arrivalTime = document.getElementById('arrival-time');
        const departureDate = document.getElementById('departure-date');
        const departureTime = document.getElementById('departure-time');
        const nights = document.getElementById('nights');
        const notes = document.getElementById('notes');

        stageTitle.innerHTML = data.name;
        stageName.value = data.name;
        stageAddress.value = data.address;

        const formattedArrival = formatDateToLocalInput(data.arrivalDateTime);
        arrivalDate.value = formattedArrival.date;
        arrivalTime.value = formattedArrival.time;

        const formattedDeparture = formatDateToLocalInput(data.departureDateTime);
        departureDate.value = formattedDeparture.date;
        departureTime.value = formattedDeparture.time;

        nights.value = data.nights;
        notes.value = data.notes;
    }

    //Fonction pour gérer la navigation dans le sélecteur de jours
    let currentDay = 1;

    document.getElementById('prev-day').addEventListener('click', () => {
        if (currentDay > 1) {
            currentDay--;
            updateDaySelector();
        }
    });

    document.getElementById('next-day').addEventListener('click', () => {
        currentDay++;
        updateDaySelector();
    });

    function updateDaySelector() {
        document.getElementById('current-day').textContent = `Jour ${currentDay}`;
    }

    // Fonction pour formater la date au format attendu par les champs date et time
    function formatDateToLocalInput(dateString) {
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


    // Chargement des roadtrips de l'utilisateur connecté
    fetch('/roadtrips', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const roadtripList = document.getElementById('roadtrip-list');
                roadtripList.innerHTML = ''; // Clear existing list
                data.forEach(roadtrip => {
                    const listItem = document.createElement('li');
                    listItem.className = 'nav-item';
                    listItem.dataset.id = roadtrip._id; // Ajouter l'ID du roadtrip
                    listItem.innerHTML = `<a class="nav-link" href="#">${roadtrip.name}</a>`;
                    listItem.addEventListener('click', selectRoadtrip);
                    roadtripList.appendChild(listItem);
                });

                //Par défaut, on sélectionne le premier roadtrip
                const firstRoadtrip = document.querySelector('#roadtrip-list .nav-item');
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

}); */