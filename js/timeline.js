
export function showTimeline() {
    // Initialiser la timeline
    var timeline_json = {
        "events": [
            {
                "start_date": {
                    "year": "2023",
                    "month": "10",
                    "day": "01"
                },
                "text": {
                    "headline": "Événement 1",
                    "text": "<p>Description de l'événement 1</p>"
                }
            },
            {
                "start_date": {
                    "year": "2023",
                    "month": "10",
                    "day": "02"
                },
                "text": {
                    "headline": "Événement 2",
                    "text": "<p>Description de l'événement 2</p>"
                }
            }
            // Ajoutez d'autres événements ici
        ]
    };

    // Supprimer tous les enfants de main-left-section
    const mainLeftSection = document.getElementById('main-left-section');
    const mainRightSection = document.getElementById('main-right-section');
    
    while (mainLeftSection.firstChild) {
        mainLeftSection.removeChild(mainLeftSection.firstChild);
    }

    // Créer un div enfant dans la div main-left-section pour afficher la timeline
    const timelineDiv = document.createElement('div');
    timelineDiv.id = 'timeline';
    document.getElementById('main-left-section').appendChild(timelineDiv);

    // Initialiser la timeline
    window.timeline = new TL.Timeline('timeline', timeline_json);


    // Étendre la section main-left-section et masquer main-right-section
    mainLeftSection.classList.remove('expanded');
    mainLeftSection.classList.remove('hidden');
    mainLeftSection.classList.add('expanded');
    mainRightSection.classList.remove('expanded');
    mainRightSection.classList.remove('hidden');
    mainRightSection.classList.add('hidden');
}