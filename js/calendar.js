// ficheir calendar.js
import { getCurrentRoadtripId } from './handleGlobals.js';

// public/js/calendar.js
const mainLeftSection = document.getElementById('main-left-section');
const mainRightSection = document.getElementById('main-right-section');

export async function showCalendar() {
    // Étendre la section main-left-section et masquer main-right-section
    mainLeftSection.classList.remove('expanded');
    mainLeftSection.classList.remove('hidden');
    mainLeftSection.classList.add('expanded');
    mainRightSection.classList.remove('expanded');
    mainRightSection.classList.remove('hidden');
    mainRightSection.classList.add('hidden');

    // Supprimer tous les enfants de main-left-section
    while (mainLeftSection.firstChild) {
        mainLeftSection.removeChild(mainLeftSection.firstChild);
    }

    // Créer un div enfant dans la div main-left-section pour afficher le calendrier
    const calendarEl = document.createElement('div');
    calendarEl.id = 'calendar';
    document.getElementById('main-left-section').appendChild(calendarEl);

    const events = await fetchEvents();
    const firstDay = events.length > 0 ? events[0].start.split('T')[0] : new Date().toISOString().split('T')[0];
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        initialDate: firstDay,
        height: '100%',
        locale: "fr",
        timeZone: false,
        events: events
    });
    calendar.render();


}

function getFirstDayOfRoadtrip() {
    // Remplacez cette fonction par votre logique pour récupérer la date du premier jour du roadtrip
    const events = fetchEvents();
    if (events.length > 0) {
        return events[0].start;
    }
    return new Date().toISOString().split('T')[0]; // Date actuelle si aucun événement
}

function fetchEvents() {
    // Récupérer les données du roadtrip courant (stages + stops)
    return fetch(`/roadtrips/${getCurrentRoadtripId()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log('Roadtrip data:', data); // Debug

            // Créer un tableau d'événements à partir des stages et stops
            const events = [];
            data.stages.forEach(stage => {
                events.push({
                    title: stage.name,
                    start: stage.arrivalDateTime,
                    end: stage.departureDateTime,
                    backgroundColor: '#ffcc00', // Couleur pour les stages
                    borderColor: '#ffcc00',
                    allDay: true
                });
            });
            data.stops.forEach(stop => {
                events.push({
                    title: stop.name,
                    start: stop.arrivalDateTime,
                    end: stop.departureDateTime,
                    backgroundColor: '#00ccff', // Couleur pour les stops
                    borderColor: '#00ccff',
                    allDay: false
                });
            });

            // Ajouter les activités des étapes
            data.stages.forEach(stage => {
                stage.activities.forEach(activity => {
                    events.push({
                        title: activity.name,
                        start: activity.startDateTime,
                        end: activity.endDateTime,
                        backgroundColor: '#ff0000', // Couleur pour les activités
                        borderColor: '#ff0000',
                        allDay: false
                    });
                });
            });



            console.log('Events:', events);
            return events;
        })
        .catch(error => {
            console.error('Error fetching roadtrip:', error);
        });

}

