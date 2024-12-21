// public/js/calendar.js
import { getCurrentRoadtripId } from './handleGlobals.js';

const mainLeftSection = document.getElementById('main-left-section');
const mainRightSection = document.getElementById('main-right-section');

function formatDate(date) {
    // Convertir la date en objet Date si nécessaire
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    // Formater la date en JJ-MM-AAAA HH:MM sans décalage horaire
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
    const formattedDate = date.toLocaleString('fr-FR', options).replace(',', '');
    return formattedDate;
}
async function fetchEvents() {
    const roadtripId = getCurrentRoadtripId();
    if (!roadtripId) {
        console.error('No roadtrip ID found');
        return { data: [], links: [] };
    }

    // Récupérer les données du roadtrip courant (stages + stops)
    return fetch(`/roadtrips/${roadtripId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Server error');
            }
            return response.json();
        })
        .then(data => {
            console.log('Roadtrip data:', data); // Debug

            // Créer un tableau d'événements à partir des stages et stops
            const tasks = {
                data: [],
                links: []
            };
            data.stages.forEach(stage => {
                const startDate = new Date(stage.arrivalDateTime.replace("Z", ""));
                const endDate = new Date(stage.departureDateTime.replace("Z", ""));

                //Convertir la durée en heures
                const duration = (endDate - startDate) / (1000 * 60 * 60); // Durée en heures

                tasks.data.push({
                    id: stage.id,
                    text: stage.name,
                    start_date: startDate,

                    end_date: endDate,
                    duration: duration,
                    progress: 0.5,
                    color: '#ffcc00'// Couleur pour les stages
                });

                //Ajouter les activités de l'étape (en les triant par ordre croissant de date de début) si les dates sont renseignées
                //Les activités sont des sous-tâches des étapes

                if (stage.activities.length > 0) {
                    stage.activities.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
                    stage.activities.forEach(activity => {
                        if (activity.startDateTime && activity.endDateTime) {
                            const startDate = new Date(activity.startDateTime.replace("Z", ""));
                            const endDate = new Date(activity.endDateTime.replace("Z", ""));
                            const duration = (endDate - startDate) / (1000 * 60 * 60); // Durée en heures

                            tasks.data.push({
                                id: activity.id,
                                text: activity.name,
                                start_date: startDate,
                                end_date: endDate,
                                duration: duration,
                                progress: 0.5,
                                color: '#ff0000', // Couleur pour les activités
                                parent: stage.id
                            });
                        }
                    });
                }


            });
            data.stops.forEach(stop => {
                const startDate = new Date(stop.arrivalDateTime.replace("Z", ""));
                const endDate = new Date(stop.departureDateTime.replace("Z", ""));
                const duration = (endDate - startDate) / (1000 * 60 * 60); // Durée en jours

                tasks.data.push({
                    id: stop.id,
                    text: stop.name,
                    start_date: startDate,
                    end_date: endDate,
                    duration: duration,
                    progress: 0.5,
                    color: '#00ccff' // Couleur pour les stops
                });
            });

            console.log('Tasks:', tasks);
            return tasks;
        })
        .catch(error => {
            console.error('Error fetching roadtrip details:', error);
            return { data: [], links: [] };
        });
}

export async function showGantt() {
    // Étendre la section main-left-section et masquer main-right-section
    mainLeftSection.classList.remove('expanded');
    mainLeftSection.classList.remove('hidden');
    mainLeftSection.classList.add('expanded');
    mainRightSection.classList.remove('expanded');
    mainRightSection.classList.remove('hidden');
    mainRightSection.classList.add('hidden');

    while (mainLeftSection.firstChild) {
        mainLeftSection.removeChild(mainLeftSection.firstChild);
    }

    // Créer un div enfant dans la div main-left-section pour afficher la timeline
    const ganttDiv = document.createElement('div');
    ganttDiv.id = 'gantt';
    document.getElementById('main-left-section').appendChild(ganttDiv);

    const tasks = await fetchEvents();

    gantt.config.columns = [
        { name: "text", label: "Etape", width: "*", tree: true },
        { name: "start_date", label: "Début", align: "center" },
    ];

    // Configurer le diagramme de Gantt pour afficher les heures et les jours
    gantt.config.scales = [
        { unit: "day", step: 1, format: "%d %M" },
        { unit: "hour", step: 2, format: "%H" }
    ];

    gantt.config.duration_unit = "hour";


    // Diminuer la largeur des colonnes de jours
    gantt.config.min_column_width = 35;

    gantt.config.autosize = "y";
    gantt.config.scroll_size = 20;

    // Configurer le diagramme de Gantt pour fonctionner en heure locale
    gantt.config.server_utc = true;

    // Réinitialiser la zone Gantt avant de la réinitialiser
    gantt.clearAll();

    gantt.init("gantt");
    gantt.parse(tasks);
}

// Assurez-vous que la fonction showGantt est accessible globalement
window.showGantt = showGantt;