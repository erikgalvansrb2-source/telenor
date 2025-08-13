let map;
let userMarker;
let receptionZoneLine;
let currentPosition = null;
let googleMapsLoaded = false;

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

async function loadGoogleMaps() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        if (!response.ok) {
            throw new Error(config.error || 'Failed to load configuration');
        }
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&callback=initMap`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
            document.getElementById('map').innerHTML = 
                '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Failed to load Google Maps</div>';
        };
        document.head.appendChild(script);
    } catch (error) {
        console.error('Error loading Google Maps configuration:', error);
        document.getElementById('map').innerHTML = 
            '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Unable to load maps. Please check server configuration.</div>';
    }
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

async function checkReceptionStatus(position) {
    try {
        const response = await fetch('/api/check-reception', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                latitude: position.lat,
                longitude: position.lng
            })
        });
        
        const data = await response.json();
        
        const statusElement = document.getElementById('status-text');
        const distanceElement = document.getElementById('distance-info');
        
        if (data.inReceptionZone) {
            statusElement.innerHTML = 
                '<span class="status-indicator status-connected"></span>LTE Reception Available';
            distanceElement.textContent = `${data.distanceToCoastKm}km from coast`;
        } else {
            statusElement.innerHTML = 
                '<span class="status-indicator status-disconnected"></span>Outside Reception Zone';
            distanceElement.textContent = `${data.distanceToCoastKm}km from coast (need ${(12 - data.distanceToCoastKm).toFixed(1)}km more)`;
        }
        
    } catch (error) {
        document.getElementById('status-text').innerHTML = 
            '<span class="status-indicator status-unknown"></span>Unable to check status';
        console.error('Error checking reception status:', error);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', loadGoogleMaps);