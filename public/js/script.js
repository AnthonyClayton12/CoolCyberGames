// Initialize game tiles
document.addEventListener('DOMContentLoaded', () => {
    // Sample game data - replace with your actual data
    const games = [
        {
            title: 'Malware Maze',
            difficulty: 'Hard',
            image: '/api/placeholder/300/200',
            url: '/games/malware-maze'
        }
        // Add more games as needed
    ];

    // Find the games grid
    const gamesGrid = document.querySelector('.games-grid');
    
    // If games grid exists, populate it
    if (gamesGrid) {
        games.forEach(game => {
            const gameElement = createGameTile(game);
            gamesGrid.appendChild(gameElement);
        });
    }

    // Handle navigation active states
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
});

// Helper function to create game tiles
function createGameTile(game) {
    const tile = document.createElement('div');
    tile.className = 'game-tile';
    
    tile.innerHTML = `
        <img src="${game.image}" alt="${game.title}" class="game-image">
        <div class="game-content">
            <h3 class="game-title">${game.title}</h3>
            <div class="game-difficulty difficulty-${game.difficulty.toLowerCase()}">${game.difficulty}</div>
            <a href="/games/" class="game-button">Play Now</a>
        </div>
    `;
    
    return tile;
}
