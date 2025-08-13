let map;
let userMarker;
let receptionZoneLine;
let currentPosition = null;
let googleMapsLoaded = false;
let coverageCircle = null;

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
    console.log('🔧 DEBUG: loadGoogleMaps() called');
    console.log('🔧 DEBUG: API Key:', GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
        console.log('✅ DEBUG: Google Maps script loaded successfully');
    };
    script.onerror = () => {
        console.error('❌ DEBUG: Google Maps script failed to load');
        document.getElementById('map').innerHTML = 
            '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; padding: 20px; text-align: center;"><div><strong>Failed to load Google Maps</strong><br><br>This might be due to API key restrictions. Please ensure the API key is configured for this domain:<br><code>https://erikgalvansrb2-source.github.io</code></div></div>';
    };
    document.head.appendChild(script);
    console.log('🔧 DEBUG: Google Maps script tag added to document');
}

function initMap() {
    console.log('🔧 DEBUG: initMap() called');
    console.log('🔧 DEBUG: google.maps available:', typeof google !== 'undefined' && typeof google.maps !== 'undefined');
    
    try {
        const mapElement = document.getElementById('map');
        console.log('🔧 DEBUG: Map element found:', mapElement ? 'Yes' : 'No');
        
        map = new google.maps.Map(mapElement, {
            zoom: 6,
            center: { lat: 65.0, lng: 10.0 },
            mapTypeId: 'terrain'
        });
        console.log('✅ DEBUG: Google Map created successfully');

        console.log('🔧 DEBUG: Calling drawReceptionZone()...');
        drawReceptionZone();
        
        console.log('🔧 DEBUG: Calling getCurrentLocation()...');
        getCurrentLocation();
        
        const refreshButton = document.getElementById('refresh-location');
        if (refreshButton) {
            refreshButton.addEventListener('click', getCurrentLocation);
            console.log('✅ DEBUG: Refresh button event listener added');
        } else {
            console.error('❌ DEBUG: Refresh button not found');
        }
        
        console.log('✅ DEBUG: initMap() completed successfully');
        
    } catch (error) {
        console.error('❌ DEBUG: Error in initMap():', error);
    }
}

function drawReceptionZone() {
    console.log('🔧 DEBUG: drawReceptionZone() called');
    console.log('🔧 DEBUG: map object exists:', map ? 'Yes' : 'No');
    console.log('🔧 DEBUG: google.maps.Polygon available:', typeof google.maps.Polygon !== 'undefined');
    
    try {
        // Create a more visible test polygon first - around Europe where the map is focused
        const testReceptionZone = [
            { lat: 70, lng: -10 },   // Northwest
            { lat: 70, lng: 40 },    // Northeast  
            { lat: 50, lng: 40 },    // Southeast
            { lat: 50, lng: -10 },   // Southwest
            { lat: 70, lng: -10 }    // Close the polygon
        ];
        
        console.log('🔧 DEBUG: Test reception zone coordinates:', testReceptionZone);
        
        // Create info window
        const infoWindow = new google.maps.InfoWindow();
        console.log('✅ DEBUG: InfoWindow created');
        
        console.log('🔧 DEBUG: Creating test polygon...');
        const globalPolygon = new google.maps.Polygon({
            paths: testReceptionZone,
            strokeColor: '#FF0000',  // Red for high visibility
            strokeOpacity: 1.0,      // Full opacity
            strokeWeight: 5,         // Very thick border
            fillColor: '#FF0000',    // Red fill
            fillOpacity: 0.5         // Very visible
        });
        console.log('✅ DEBUG: Global polygon object created');
        
        console.log('🔧 DEBUG: Adding polygon to map...');
        globalPolygon.setMap(map);
        console.log('✅ DEBUG: Global polygon added to map');
        
        // Add click info
        globalPolygon.addListener('click', function(event) {
            console.log('🔧 DEBUG: Test polygon clicked at:', event.latLng.toString());
            infoWindow.setContent(`
                <div style="padding: 5px;">
                    <strong>🔴 TEST: Maritime LTE Coverage Zone</strong><br>
                    This red area represents the global LTE coverage concept<br>
                    <small>Coverage in international waters ≥12km from any coastline</small>
                </div>
            `);
            infoWindow.setPosition(event.latLng);
            infoWindow.open(map);
        });
        console.log('✅ DEBUG: Global polygon click listener added');
        
        // Draw Norwegian coastline for reference
        console.log('🔧 DEBUG: Creating Norwegian coastline...');
        console.log('🔧 DEBUG: norwegianCoastline data:', norwegianCoastline.length, 'points');
        
        const coastline = new google.maps.Polyline({
            path: norwegianCoastline,
            geodesic: true,
            strokeColor: '#8B4513',
            strokeOpacity: 0.8,
            strokeWeight: 2
        });
        console.log('✅ DEBUG: Norwegian coastline polyline created');
        
        coastline.setMap(map);
        console.log('✅ DEBUG: Norwegian coastline added to map');
        
        console.log('✅ DEBUG: drawReceptionZone() completed successfully');
        
    } catch (error) {
        console.error('❌ DEBUG: Error in drawReceptionZone():', error);
        console.error('❌ DEBUG: Error stack:', error.stack);
    }
}

function createReceptionZonePolygon() {
    // Create simple test rectangles that should be very visible
    console.log('Creating reception zone polygons...');
    
    const receptionAreas = [];
    
    // Large test rectangle in North Sea (should be very obvious)
    const testArea = [
        { lat: 60.0, lng: 2.0 },
        { lat: 60.0, lng: 5.0 },
        { lat: 58.0, lng: 5.0 },
        { lat: 58.0, lng: 2.0 },
        { lat: 60.0, lng: 2.0 }  // Close the polygon
    ];
    
    receptionAreas.push(testArea);
    
    console.log('Created', receptionAreas.length, 'reception areas');
    console.log('First area:', testArea);
    
    return receptionAreas;
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
    console.log('🔧 DEBUG: getCurrentLocation() called');
    console.log('🔧 DEBUG: navigator.geolocation available:', !!navigator.geolocation);
    
    if (navigator.geolocation) {
        console.log('🔧 DEBUG: Requesting geolocation...');
        navigator.geolocation.getCurrentPosition(
            function(position) {
                console.log('✅ DEBUG: Geolocation success:', position.coords);
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('🔧 DEBUG: currentPosition set to:', currentPosition);
                
                console.log('🔧 DEBUG: Calling updateLocationDisplay()...');
                updateLocationDisplay(currentPosition);
                
                console.log('🔧 DEBUG: Calling updateUserMarker()...');
                updateUserMarker(currentPosition);
                
                console.log('🔧 DEBUG: Calling checkReceptionStatus()...');
                checkReceptionStatus(currentPosition);
            },
            function(error) {
                console.error('❌ DEBUG: Geolocation error:', error);
                console.error('❌ DEBUG: Error code:', error.code, 'Message:', error.message);
                document.getElementById('location-text').textContent = 'Location access denied';
                document.getElementById('status-text').innerHTML = 
                    '<span class="status-indicator status-unknown"></span>Unable to get location';
            }
        );
    } else {
        console.error('❌ DEBUG: Geolocation not supported');
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
// For a global maritime service, this would ideally use a comprehensive global coastline dataset
// For now, we'll use a simplified approach with major coastal points worldwide
function calculateDistanceToCoast(userPos) {
    const globalCoastalPoints = [
        // Norway (original focus area)
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
        { latitude: 63.4305, longitude: 10.3951 },
        { latitude: 62.4722, longitude: 6.1495 },
        { latitude: 61.1217, longitude: 5.0218 },
        { latitude: 60.3913, longitude: 5.3221 },
        { latitude: 59.9139, longitude: 10.7522 },
        { latitude: 58.9700, longitude: 9.2300 },
        { latitude: 58.1467, longitude: 8.0014 },
        { latitude: 58.9667, longitude: 5.7333 },
        { latitude: 59.2181, longitude: 5.0408 },
        
        // Major European coastlines
        { latitude: 60.0, longitude: -1.0 },   // Scotland
        { latitude: 55.0, longitude: -4.0 },   // Ireland
        { latitude: 51.5, longitude: 1.0 },    // England
        { latitude: 49.0, longitude: 2.0 },    // France
        { latitude: 43.0, longitude: -2.0 },   // Spain
        { latitude: 41.0, longitude: 9.0 },    // Italy
        { latitude: 37.0, longitude: 23.0 },   // Greece
        
        // Major global coastlines (simplified)
        { latitude: 40.0, longitude: -74.0 },  // US East Coast
        { latitude: 34.0, longitude: -118.0 }, // US West Coast
        { latitude: -33.9, longitude: 18.4 },  // South Africa
        { latitude: -33.8, longitude: 151.2 }, // Australia
        { latitude: 35.7, longitude: 139.7 },  // Japan
        { latitude: 1.3, longitude: 103.8 },   // Singapore
        { latitude: 55.7, longitude: 37.6 },   // Russia
        
        // Note: In a production system, this would use a comprehensive
        // global coastline database with thousands of points
    ];

    let minDistance = Infinity;
    
    for (const point of globalCoastalPoints) {
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
        
        // Remove existing coverage circle
        if (coverageCircle) {
            coverageCircle.setMap(null);
        }
        
        if (inReceptionZone) {
            statusElement.innerHTML = 
                '<span class="status-indicator status-connected"></span>LTE Reception Available';
            distanceElement.textContent = `${distanceToCoastKm}km from coast`;
            
            // Show green coverage area around user
            coverageCircle = new google.maps.Circle({
                center: position,
                radius: 5000, // 5km radius around user position
                strokeColor: '#28a745',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#28a745',
                fillOpacity: 0.2
            });
            coverageCircle.setMap(map);
            
        } else {
            statusElement.innerHTML = 
                '<span class="status-indicator status-disconnected"></span>Outside Reception Zone';
            const needMore = Math.round((12000 - distanceToCoast) / 1000 * 100) / 100;
            distanceElement.textContent = `${distanceToCoastKm}km from coast (need ${needMore}km more)`;
            
            // Show red "no coverage" area around user
            coverageCircle = new google.maps.Circle({
                center: position,
                radius: 3000, // 3km radius around user position
                strokeColor: '#dc3545',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#dc3545',
                fillOpacity: 0.1
            });
            coverageCircle.setMap(map);
        }
        
    } catch (error) {
        document.getElementById('status-text').innerHTML = 
            '<span class="status-indicator status-unknown"></span>Unable to check status';
        console.error('Error checking reception status:', error);
    }
}

// Initialize the application
console.log('🔧 DEBUG: Script loaded, adding DOMContentLoaded listener');
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DEBUG: DOMContentLoaded event fired');
    console.log('🔧 DEBUG: Document ready, calling loadGoogleMaps()...');
    loadGoogleMaps();
});