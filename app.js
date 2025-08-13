let map;
let userMarker;
let receptionZoneLine;
let currentPosition = null;
let googleMapsLoaded = false;
let coverageCircle = null;
let norwegianCoastline = []; // Will be populated from API or fallback
let coastlineLoaded = false;

// Environment detection
const isStaticDeployment = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
const API_BASE = isStaticDeployment ? '' : window.location.origin;

// Fallback API key for static deployment (replace with your key)
const STATIC_GOOGLE_MAPS_API_KEY = 'AIzaSyCVCP7JXnHdf3LUt-WE9uMVpzRuW6dlUYo';

async function loadGoogleMaps() {
    console.log('🔧 DEBUG: loadGoogleMaps() called');
    console.log('🔧 DEBUG: Environment detected:', isStaticDeployment ? 'Static Deployment' : 'Local Development');
    
    try {
        if (isStaticDeployment) {
            // Static deployment mode - use fallbacks
            console.log('🔧 DEBUG: Using static deployment mode');
            window.GOOGLE_MAPS_API_KEY = STATIC_GOOGLE_MAPS_API_KEY;
            await loadFallbackCoastlineData();
        } else {
            // Local development mode - use APIs
            console.log('🔧 DEBUG: Using local development mode');
            await Promise.all([
                loadCoastlineData(),
                loadAPIConfig()
            ]);
        }
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${window.GOOGLE_MAPS_API_KEY}&callback=initMap&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log('✅ DEBUG: Google Maps script loaded successfully');
        };
        script.onerror = () => {
            console.error('❌ DEBUG: Google Maps script failed to load');
            document.getElementById('map').innerHTML = 
                '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; padding: 20px; text-align: center;"><div><strong>Failed to load Google Maps</strong><br><br>Please check API key configuration</div></div>';
        };
        document.head.appendChild(script);
        console.log('🔧 DEBUG: Google Maps script tag added to document');
        
    } catch (error) {
        console.error('❌ DEBUG: Error loading initial data:', error);
        document.getElementById('map').innerHTML = 
            '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; padding: 20px; text-align: center;"><div><strong>Failed to load application</strong><br><br>' + error.message + '</div></div>';
    }
}

async function loadAPIConfig() {
    try {
        const response = await fetch(`${API_BASE}/api/config`);
        if (!response.ok) {
            throw new Error('Failed to load API configuration');
        }
        const config = await response.json();
        window.GOOGLE_MAPS_API_KEY = config.googleMapsApiKey;
        console.log('✅ DEBUG: API configuration loaded');
    } catch (error) {
        console.error('❌ DEBUG: Error loading API config:', error);
        throw error;
    }
}

async function loadCoastlineData() {
    try {
        console.log('🔧 DEBUG: Loading coastline data from API...');
        const response = await fetch(`${API_BASE}/api/coastline`);
        if (!response.ok) {
            throw new Error('Failed to load coastline data');
        }
        const data = await response.json();
        
        // Convert backend format to frontend format
        norwegianCoastline = data.points.map(point => ({
            lat: point.latitude,
            lng: point.longitude
        }));
        
        coastlineLoaded = true;
        console.log(`✅ DEBUG: Loaded ${norwegianCoastline.length} coastline points`);
        console.log('🔧 DEBUG: Cached:', data.cached, 'Last updated:', data.lastUpdated);
        
    } catch (error) {
        console.error('❌ DEBUG: Error loading coastline data:', error);
        await loadFallbackCoastlineData();
    }
}

async function loadFallbackCoastlineData() {
    console.log('🔧 DEBUG: Loading fallback coastline data for static deployment...');
    
    // Enhanced fallback coastline with more points for better accuracy in static mode
    norwegianCoastline = [
        { lat: 71.1856, lng: 25.7843 }, // Finnmark
        { lat: 70.6632, lng: 23.6815 },
        { lat: 69.9496, lng: 23.2717 },
        { lat: 69.0575, lng: 20.2182 },
        { lat: 68.8908, lng: 16.0304 },
        { lat: 68.5089, lng: 14.6370 },
        { lat: 67.2804, lng: 14.3656 },
        { lat: 66.3142, lng: 12.4442 },
        { lat: 65.8470, lng: 11.2280 },
        { lat: 64.4734, lng: 11.3849 },
        { lat: 63.4305, lng: 10.3951 }, // Trondheim area
        { lat: 62.4722, lng: 6.1495 },
        { lat: 61.1217, lng: 5.0218 },
        { lat: 60.3913, lng: 5.3221 },  // Bergen area
        { lat: 59.9139, lng: 10.7522 }, // Oslo area
        { lat: 58.9700, lng: 9.2300 },
        { lat: 58.1467, lng: 8.0014 },  // Kristiansand
        { lat: 58.9667, lng: 5.7333 },  // Stavanger
        { lat: 59.2181, lng: 5.0408 }
    ];
    
    coastlineLoaded = true;
    console.log(`✅ DEBUG: Loaded ${norwegianCoastline.length} fallback coastline points`);
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

        // Wait for coastline data to be loaded before drawing reception zone
        if (coastlineLoaded) {
            console.log('🔧 DEBUG: Coastline already loaded, calling drawReceptionZone()...');
            drawReceptionZone();
        } else {
            console.log('⏳ DEBUG: Waiting for coastline data to load...');
            // Set up a check to draw the zone once data is loaded
            const checkCoastlineInterval = setInterval(() => {
                if (coastlineLoaded) {
                    console.log('✅ DEBUG: Coastline data loaded, drawing reception zone...');
                    drawReceptionZone();
                    clearInterval(checkCoastlineInterval);
                }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkCoastlineInterval);
                if (!coastlineLoaded) {
                    console.error('❌ DEBUG: Timeout waiting for coastline data');
                }
            }, 10000);
        }
        
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
    console.log('🔧 DEBUG: coastlineLoaded:', coastlineLoaded, 'coastline points:', norwegianCoastline.length);
    
    if (!coastlineLoaded || norwegianCoastline.length === 0) {
        console.log('⏳ DEBUG: Coastline data not ready, will retry when loaded');
        return;
    }
    
    try {
        const infoWindow = new google.maps.InfoWindow();
        
        // Draw Norwegian coastline (brown line)
        console.log('🔧 DEBUG: Drawing Norwegian coastline...');
        const coastline = new google.maps.Polyline({
            path: norwegianCoastline,
            geodesic: true,
            strokeColor: '#8B4513',
            strokeOpacity: 0.8,
            strokeWeight: 2
        });
        coastline.setMap(map);
        
        // Calculate and draw the 12km offshore boundary (blue line)
        console.log('🔧 DEBUG: Calculating 12km offshore boundary...');
        const offshorePoints = calculateOffshorePoints(norwegianCoastline, 12000); // 12km in meters
        
        const receptionBoundary = new google.maps.Polyline({
            path: offshorePoints,
            geodesic: true,
            strokeColor: '#0066cc',
            strokeOpacity: 0.9,
            strokeWeight: 3
        });
        receptionBoundary.setMap(map);
        
        // Add click listener to the reception boundary
        receptionBoundary.addListener('click', function(event) {
            console.log('🔧 DEBUG: Reception boundary clicked');
            infoWindow.setContent(`
                <div style="padding: 10px;">
                    <strong>🟢 Telenor Maritime LTE Reception Zone</strong><br>
                    <small>Coverage available ≥12km from Norwegian coast</small><br>
                    <small>Blue line shows the minimum distance for reception</small>
                </div>
            `);
            infoWindow.setPosition(event.latLng);
            infoWindow.open(map);
        });
        
        // Add click listener to the coastline for reference
        coastline.addListener('click', function(event) {
            infoWindow.setContent(`
                <div style="padding: 10px;">
                    <strong>Norwegian Coastline</strong><br>
                    <small>LTE reception starts 12km offshore from here</small>
                </div>
            `);
            infoWindow.setPosition(event.latLng);
            infoWindow.open(map);
        });
        
        console.log('✅ DEBUG: Reception zone visualization completed');
        console.log(`✅ DEBUG: Coastline: ${norwegianCoastline.length} points, Offshore: ${offshorePoints.length} points`);
        
    } catch (error) {
        console.error('❌ DEBUG: Error in drawReceptionZone():', error);
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

async function checkReceptionStatus(position) {
    try {
        if (isStaticDeployment) {
            console.log('🔧 DEBUG: Checking reception status using client-side calculation...');
            checkReceptionStatusClientSide(position);
        } else {
            console.log('🔧 DEBUG: Checking reception status via API...');
            await checkReceptionStatusAPI(position);
        }
    } catch (error) {
        console.error('❌ DEBUG: Error checking reception status:', error);
        document.getElementById('status-text').innerHTML = 
            '<span class="status-indicator status-unknown"></span>Unable to check status';
        document.getElementById('distance-info').textContent = 'Error checking reception status';
    }
}

async function checkReceptionStatusAPI(position) {
    const response = await fetch(`${API_BASE}/api/check-reception`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            latitude: position.lat,
            longitude: position.lng
        })
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ DEBUG: Reception status received:', data);
    
    displayReceptionStatus(data.inReceptionZone, data.distanceToCoastKm, data.message, position);
}

function checkReceptionStatusClientSide(position) {
    const distanceToCoast = calculateDistanceToCoast(position);
    const inReceptionZone = distanceToCoast >= 12000; // 12km in meters
    const distanceToCoastKm = Math.round(distanceToCoast / 1000 * 100) / 100;
    
    const message = inReceptionZone 
        ? 'You are in the Telenor Maritime LTE reception zone'
        : `You need to be ${Math.round((12000 - distanceToCoast) / 1000 * 100) / 100}km further offshore for LTE reception`;
    
    console.log('✅ DEBUG: Client-side reception status calculated:', { inReceptionZone, distanceToCoastKm, message });
    displayReceptionStatus(inReceptionZone, distanceToCoastKm, message, position);
}

function displayReceptionStatus(inReceptionZone, distanceToCoastKm, message, position) {
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
        distanceElement.textContent = message;
        
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
}

// Initialize the application
console.log('🔧 DEBUG: Script loaded, adding DOMContentLoaded listener');
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DEBUG: DOMContentLoaded event fired');
    console.log('🔧 DEBUG: Document ready, calling loadGoogleMaps()...');
    loadGoogleMaps();
});