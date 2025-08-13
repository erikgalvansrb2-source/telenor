let map;
let userMarker;
let receptionZoneLine;
let currentPosition = null;
let googleMapsLoaded = false;

// Google Maps API Key for static deployment
const GOOGLE_MAPS_API_KEY = 'AIzaSyCVCP7JXnHdf3LUt-WE9uMVpzRuW6dlUYo';

const norwegianCoastline = [
    { lat: 71.1856, lng: 25.7843 },
    { lat: 70.6632, lng: 23.6815 },
    { lat: 69.9496, lng: 23.2717 },
    { lat: 69.0575, lng: 20.2182 },
    { lat: 68.8908, lng: 16.0304 },
    { lat: 68.5089, lng: 14.6370 },
    { lat: 67.2804, lng: 14.3656 },
    { lat: 66.3142, lng: 12.4442 },
    { lat: 65.8470, lng: 11.2280 },
    { lat: 64.4734, lng: 11.3849 },
    { lat: 63.4305, lng: 10.3951 },
    { lat: 62.4722, lng: 6.1495 },
    { lat: 61.1217, lng: 5.0218 },
    { lat: 60.3913, lng: 5.3221 },
    { lat: 59.9139, lng: 10.7522 },
    { lat: 58.9700, lng: 9.2300 },
    { lat: 58.1467, lng: 8.0014 },
    { lat: 58.9667, lng: 5.7333 },
    { lat: 59.2181, lng: 5.0408 }
];

function loadGoogleMaps() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
        document.getElementById('map').innerHTML = 
            '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; padding: 20px; text-align: center;"><div><strong>Failed to load Google Maps</strong><br><br>This might be due to API key restrictions. Please ensure the API key is configured for this domain:<br><code>https://erikgalvansrb2-source.github.io</code></div></div>';
    };
    document.head.appendChild(script);
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 6,
        center: { lat: 65.0, lng: 10.0 },
        mapTypeId: 'terrain'
    });

    drawReceptionZone();
    getCurrentLocation();
    
    document.getElementById('refresh-location').addEventListener('click', getCurrentLocation);
}

function drawReceptionZone() {
    const receptionZoneCoordinates = calculateOffshorePoints(norwegianCoastline, 12000);
    
    receptionZoneLine = new google.maps.Polyline({
        path: receptionZoneCoordinates,
        geodesic: true,
        strokeColor: '#0066cc',
        strokeOpacity: 1.0,
        strokeWeight: 3
    });
    
    receptionZoneLine.setMap(map);

    const coastline = new google.maps.Polyline({
        path: norwegianCoastline,
        geodesic: true,
        strokeColor: '#8B4513',
        strokeOpacity: 0.8,
        strokeWeight: 2
    });
    
    coastline.setMap(map);

    const infoWindow = new google.maps.InfoWindow({
        content: '<div style="padding: 5px;"><strong>LTE Reception Zone</strong><br>Coverage starts 12km from coast</div>'
    });

    receptionZoneLine.addListener('click', function(event) {
        infoWindow.setPosition(event.latLng);
        infoWindow.open(map);
    });
}

function calculateOffshorePoints(coastlinePoints, distanceMeters) {
    const offshorePoints = [];
    
    for (let i = 0; i < coastlinePoints.length; i++) {
        const point = coastlinePoints[i];
        const nextPoint = coastlinePoints[(i + 1) % coastlinePoints.length];
        
        const bearing = calculateBearing(point, nextPoint);
        const perpendicularBearing = (bearing + 90) % 360;
        
        const offshorePoint = calculateDestination(point, perpendicularBearing, distanceMeters);
        offshorePoints.push(offshorePoint);
    }
    
    return offshorePoints;
}

function calculateBearing(point1, point2) {
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;
    
    const x = Math.sin(deltaLng) * Math.cos(lat2);
    const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    
    const bearing = Math.atan2(x, y) * 180 / Math.PI;
    return (bearing + 360) % 360;
}

function calculateDestination(point, bearing, distance) {
    const R = 6371000;
    const lat1 = point.lat * Math.PI / 180;
    const lng1 = point.lng * Math.PI / 180;
    const bearingRad = bearing * Math.PI / 180;
    
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / R) +
                          Math.cos(lat1) * Math.sin(distance / R) * Math.cos(bearingRad));
    const lng2 = lng1 + Math.atan2(Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(lat1),
                                   Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2));
    
    return {
        lat: lat2 * 180 / Math.PI,
        lng: lng2 * 180 / Math.PI
    };
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                updateLocationDisplay(currentPosition);
                updateUserMarker(currentPosition);
                checkReceptionStatus(currentPosition);
            },
            function(error) {
                document.getElementById('location-text').textContent = 'Location access denied';
                document.getElementById('status-text').innerHTML = 
                    '<span class="status-indicator status-unknown"></span>Unable to get location';
            }
        );
    } else {
        document.getElementById('location-text').textContent = 'Geolocation not supported';
        document.getElementById('status-text').innerHTML = 
            '<span class="status-indicator status-unknown"></span>Geolocation not available';
    }
}

function updateLocationDisplay(position) {
    const lat = position.lat.toFixed(6);
    const lng = position.lng.toFixed(6);
    document.getElementById('location-text').innerHTML = 
        `<strong>Lat:</strong> ${lat}<br><strong>Lng:</strong> ${lng}`;
}

function updateUserMarker(position) {
    if (userMarker) {
        userMarker.setMap(null);
    }
    
    userMarker = new google.maps.Marker({
        position: position,
        map: map,
        title: 'Your Location',
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#0066cc" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(24, 24)
        }
    });
    
    map.setCenter(position);
    map.setZoom(10);
}

// Client-side distance calculation using Haversine formula
function calculateDistanceToCoast(userPos) {
    const coastalPoints = [
        { latitude: 71.1856, longitude: 25.7843 }, // Northern Norway
        { latitude: 70.6632, longitude: 23.6815 },
        { latitude: 69.9496, longitude: 23.2717 },
        { latitude: 69.0575, longitude: 20.2182 },
        { latitude: 68.8908, longitude: 16.0304 },
        { latitude: 68.5089, longitude: 14.6370 },
        { latitude: 67.2804, longitude: 14.3656 },
        { latitude: 66.3142, longitude: 12.4442 },
        { latitude: 65.8470, longitude: 11.2280 },
        { latitude: 64.4734, longitude: 11.3849 },
        { latitude: 63.4305, longitude: 10.3951 }, // Trondheim
        { latitude: 62.4722, longitude: 6.1495 },
        { latitude: 61.1217, longitude: 5.0218 },
        { latitude: 60.3913, longitude: 5.3221 }, // Bergen
        { latitude: 59.9139, longitude: 10.7522 }, // Oslo
        { latitude: 58.9700, longitude: 9.2300 },
        { latitude: 58.1467, longitude: 8.0014 }, // Kristiansand
        { latitude: 58.9667, longitude: 5.7333 }, // Stavanger
        { latitude: 59.2181, longitude: 5.0408 }
    ];

    let minDistance = Infinity;
    
    for (const point of coastalPoints) {
        const distance = haversineDistance(
            userPos.lat, userPos.lng,
            point.latitude, point.longitude
        );
        if (distance < minDistance) {
            minDistance = distance;
        }
    }
    
    return minDistance;
}

// Haversine formula for calculating distance between two points on Earth
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function checkReceptionStatus(position) {
    try {
        const distanceToCoast = calculateDistanceToCoast(position);
        const inReceptionZone = distanceToCoast >= 12000; // 12km in meters
        const distanceToCoastKm = Math.round(distanceToCoast / 1000 * 100) / 100;
        
        const statusElement = document.getElementById('status-text');
        const distanceElement = document.getElementById('distance-info');
        
        if (inReceptionZone) {
            statusElement.innerHTML = 
                '<span class="status-indicator status-connected"></span>LTE Reception Available';
            distanceElement.textContent = `${distanceToCoastKm}km from coast`;
        } else {
            statusElement.innerHTML = 
                '<span class="status-indicator status-disconnected"></span>Outside Reception Zone';
            const needMore = Math.round((12000 - distanceToCoast) / 1000 * 100) / 100;
            distanceElement.textContent = `${distanceToCoastKm}km from coast (need ${needMore}km more)`;
        }
        
    } catch (error) {
        document.getElementById('status-text').innerHTML = 
            '<span class="status-indicator status-unknown"></span>Unable to check status';
        console.error('Error checking reception status:', error);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', loadGoogleMaps);