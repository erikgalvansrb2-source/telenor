let map;
let userPosition = null;
let coastalData = null;
let userMarker = null;
let lteZonePolygon = null;
let coastalPolygons = [];

// Initialize the map
function initMap() {
    // Create map centered on a default location (will update when user location is found)
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 6,
        center: { lat: 60.0, lng: 10.0 }, // Norway as default
        mapTypeId: 'hybrid',
        styles: [
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#0077be' }]
            }
        ]
    });

    // Load coastal data and initialize geolocation
    loadCoastalData();
    getCurrentLocation();
}

// Get user's current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                userPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                updateUserPosition();
                updateReceptionStatus();
            },
            (error) => {
                handleLocationError(error);
            },
            options
        );

        // Watch for position changes
        navigator.geolocation.watchPosition(
            (position) => {
                userPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                updateUserPosition();
                updateReceptionStatus();
            },
            (error) => {
                console.error('Error watching position:', error);
            },
            options
        );
    } else {
        document.getElementById('coordinates').textContent = 'Geolocation not supported';
        document.getElementById('reception-status').textContent = 'Unable to determine';
    }
}

// Handle location errors
function handleLocationError(error) {
    let message = '';
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = 'Location access denied';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Location unavailable';
            break;
        case error.TIMEOUT:
            message = 'Location request timeout';
            break;
        default:
            message = 'Unknown location error';
            break;
    }
    
    document.getElementById('coordinates').textContent = message;
    document.getElementById('reception-status').textContent = 'Unable to determine';
}

// Load coastal line data from GeoJSON file
async function loadCoastalData() {
    try {
        const response = await fetch('ne_110m_land.geojson');
        if (!response.ok) {
            throw new Error('Failed to load coastal data');
        }
        
        coastalData = await response.json();
        displayCoastalLines();
        calculateLTEZone();
        
        if (userPosition) {
            updateReceptionStatus();
        }
    } catch (error) {
        console.error('Error loading coastal data:', error);
        showError('Failed to load coastal data. LTE zone calculation unavailable.');
    }
}

// Display coastal lines on the map
function displayCoastalLines() {
    if (!coastalData || !coastalData.features) return;

    coastalData.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
            const coordinates = feature.geometry.coordinates[0].map(coord => ({
                lat: coord[1],
                lng: coord[0]
            }));

            const polygon = new google.maps.Polygon({
                paths: coordinates,
                strokeColor: '#8B4513',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#DEB887',
                fillOpacity: 0.3
            });

            polygon.setMap(map);
            coastalPolygons.push(polygon);
        } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(polygonCoords => {
                const coordinates = polygonCoords[0].map(coord => ({
                    lat: coord[1],
                    lng: coord[0]
                }));

                const polygon = new google.maps.Polygon({
                    paths: coordinates,
                    strokeColor: '#8B4513',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#DEB887',
                    fillOpacity: 0.3
                });

                polygon.setMap(map);
                coastalPolygons.push(polygon);
            });
        }
    });
}

// Calculate and display LTE reception zone (simplified approach)
function calculateLTEZone() {
    if (!coastalData) return;

    // Create a simplified LTE zone visualization
    // In a real implementation, you would use more sophisticated geometric calculations
    // For now, we'll create a general ocean area polygon as an example
    
    const oceanBounds = [
        { lat: 90, lng: -180 },
        { lat: 90, lng: 180 },
        { lat: -90, lng: 180 },
        { lat: -90, lng: -180 }
    ];

    lteZonePolygon = new google.maps.Polygon({
        paths: oceanBounds,
        strokeColor: '#2ecc71',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: '#2ecc71',
        fillOpacity: 0.15
    });

    lteZonePolygon.setMap(map);
}

// Update user position on map and info panel
function updateUserPosition() {
    if (!userPosition) return;

    // Update coordinates display
    document.getElementById('coordinates').textContent = 
        `${userPosition.lat.toFixed(6)}, ${userPosition.lng.toFixed(6)}`;

    // Update or create user marker
    if (userMarker) {
        userMarker.setPosition(userPosition);
    } else {
        userMarker = new google.maps.Marker({
            position: userPosition,
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#e74c3c',
                fillOpacity: 1,
                strokeColor: '#c0392b',
                strokeWeight: 2
            },
            title: 'Your Position'
        });
    }

    // Center map on user position
    map.setCenter(userPosition);
    map.setZoom(8);
}

// Calculate distance from point to coastline and update reception status
function updateReceptionStatus() {
    if (!userPosition || !coastalData) {
        document.getElementById('reception-status').textContent = 'Calculating...';
        return;
    }

    // Simplified distance calculation
    // In a real implementation, you would calculate the actual distance to the nearest coastal point
    const distanceToCoast = calculateDistanceToCoast(userPosition);
    
    const statusElement = document.getElementById('reception-status');
    statusElement.className = ''; // Clear previous classes

    if (distanceToCoast > 12) {
        statusElement.textContent = `LTE Available (${distanceToCoast.toFixed(1)}km from coast)`;
        statusElement.classList.add('status-good');
    } else {
        statusElement.textContent = `No LTE Signal (${distanceToCoast.toFixed(1)}km from coast)`;
        statusElement.classList.add('status-bad');
    }
}

// Simplified distance calculation to coastal areas
function calculateDistanceToCoast(position) {
    if (!coastalData || !coastalData.features) return 0;

    let minDistance = Infinity;

    // This is a simplified calculation
    // In a real application, you would use proper geometric algorithms
    coastalData.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
            const coordinates = feature.geometry.coordinates[0];
            coordinates.forEach(coord => {
                const distance = haversineDistance(
                    position.lat, position.lng,
                    coord[1], coord[0]
                );
                minDistance = Math.min(minDistance, distance);
            });
        } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(polygonCoords => {
                polygonCoords[0].forEach(coord => {
                    const distance = haversineDistance(
                        position.lat, position.lng,
                        coord[1], coord[0]
                    );
                    minDistance = Math.min(minDistance, distance);
                });
            });
        }
    });

    return minDistance;
}

// Calculate distance between two points using Haversine formula
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Convert degrees to radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.getElementById('location-info').appendChild(errorDiv);
}

// Initialize when page loads
if (typeof google === 'undefined') {
    window.initMap = initMap;
}