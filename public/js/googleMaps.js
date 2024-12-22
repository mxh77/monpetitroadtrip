export function openAddressInGoogleMaps(address) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`);
}

// Fonction pour rechercher et afficher des sentiers de randonnée autour d'une adresse
export async function fetchTrails(address) {
    try {
        // Requête pour obtenir les sentiers de randonnée autour de l'adresse
        const trailsResponse = await fetch(`/gm/trails?address=${encodeURIComponent(address)}`);
        const trailsData = await trailsResponse.json();
        console.log('trailsData:', trailsData);

        if (trailsData.results && trailsData.results.length > 0) {
            displayTrails(trailsData.results);
        } else {
            alert('Aucun sentier de randonnée trouvé pour cet emplacement.');
        }
    } catch (error) {
        console.error('Erreur lors de la recherche des sentiers de randonnée:', error);
        alert('Erreur lors de la recherche des sentiers de randonnée.');
    }
}

// Fonction pour afficher les sentiers de randonnée
function displayTrails(trails) {
    const trailsContainer = document.getElementById('trails-container');
    trailsContainer.innerHTML = `
        <table class="table table-striped table-bordered">
            <thead class="thead-dark">
                <tr>
                    <th>Nom</th>
                    <th>Dist. adresse</th>
                    <th>Rating</th>
                    <th>Total Vote</th>
                    <th>Préférence</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${trails.map((trail, index) => `
                    <tr>
                        <td>${trail.name}</td>
                        <td>${trail.distance.toFixed(2)}</td>
                        <td>${trail.rating}</td>
                        <td>${trail.user_ratings_total}</td>
                        <td>${trail.preference.toFixed(2)}</td>
                        <td>
                            <input type="hidden" class="trail-address" id="trail-${index}" value="${trail.trailAddress}">
                            <button class="btn btn-primary btn-sm open-map-btn" data-address-id="trail-${index}">
                                <i class="fas fa-map-marker-alt"></i>
                            </button>
                        </td>                        
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Fonction pour récupérer et afficher les avis liés à une adresse
export async function fetchReviews(address) {
    try {
        const response = await fetch(`/gm/steps/reviews?address=${encodeURIComponent(address)}`);
        console.log('response:', response);
        const data = await response.json();
        console.log('data:', data);

        // Inspecter la structure de l'objet data
        if (data.result) {
            console.log('data.result:', data.result);
        } else {
            console.log('data.result is undefined');
        }

        if (data.result && data.result.reviews) {
            displayReviews(data.result.reviews);
        } else {
            alert('Aucun avis trouvé pour ce lieu.');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des avis:', error);
        alert('Erreur lors de la récupération des avis.');
    }
}

// Fonction pour afficher les avis
function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviews-container');
    reviewsContainer.innerHTML = reviews.map(review => `
        <div class="review">
            <p><strong>${review.author_name}</strong> (${review.rating} étoiles)</p>
            <p>${review.text}</p>
        </div>
    `).join('');
}

