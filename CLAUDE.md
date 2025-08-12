# Claude Development Documentation

This document describes the Telenor Maritime LTE Reception Tracker system created by Claude.

## Project Overview

A web application that helps cruise ship passengers and maritime users track when they enter the Telenor Maritime LTE reception zone, which begins approximately 12km from the Norwegian coast.

## System Architecture

### Backend (Node.js/Express)
**File**: `server.js`
- **Port**: 3000 (configurable via PORT env var)
- **Dependencies**: express, cors, geolib
- **Main API Endpoint**: `POST /api/check-reception`

### Frontend (Vanilla HTML/CSS/JavaScript)
**Files**: 
- `public/index.html` - Main interface
- `public/app.js` - Google Maps integration and GPS logic

### Configuration
**Files**:
- `package.json` - Project dependencies and scripts
- `.env.example` - Environment variables template

## Key Components

### 1. Norwegian Coastline Data
**Location**: `server.js` (coastalPoints array) and `app.js` (norwegianCoastline array)

Predefined coordinate points covering the Norwegian coast from north to south:
- Northern Norway (Finnmark): 71.1856°N, 25.7843°E
- Trondheim area: 63.4305°N, 10.3951°E
- Bergen area: 60.3913°N, 5.3221°E
- Oslo area: 59.9139°N, 10.7522°E
- Southern coast: 58.1467°N, 8.0014°E

### 2. Distance Calculation Algorithm
**Function**: `calculateDistanceToCoast()` in `server.js`

Uses the geolib library to:
1. Calculate distance from user position to each coastline point
2. Return the minimum distance (closest point to coast)
3. Determine if user is ≥12km offshore for LTE coverage

### 3. Reception Zone Visualization
**Function**: `drawReceptionZone()` in `app.js`

Creates two polylines on Google Maps:
- **Brown line**: Norwegian coastline
- **Blue line**: 12km offshore boundary (LTE reception zone)

Uses perpendicular bearing calculation to project coastline points 12km seaward.

### 4. GPS Location Services
**Function**: `getCurrentLocation()` in `app.js`

Implements browser geolocation API:
- Requests user permission for location access
- Updates user marker on map
- Triggers reception status check
- Handles geolocation errors gracefully

### 5. Real-time Status Updates
**Function**: `checkReceptionStatus()` in `app.js`

Makes API calls to backend to determine:
- Whether user is in LTE reception zone
- Distance to coast in kilometers
- How much further offshore needed for coverage

## API Documentation

### POST /api/check-reception

**Purpose**: Determines if GPS coordinates are within Telenor Maritime LTE coverage

**Request**:
```json
{
  "latitude": 60.3913,
  "longitude": 5.3221
}
```

**Response**:
```json
{
  "inReceptionZone": true,
  "distanceToCoast": 15000,
  "distanceToCoastKm": 15.0,
  "message": "You are in the Telenor Maritime LTE reception zone"
}
```

**Logic**:
- Distance ≥12000 meters = In reception zone
- Distance <12000 meters = Outside reception zone

## User Interface Features

### Status Indicators
- 🟢 Green dot: LTE reception available
- 🔴 Red dot: Outside reception zone  
- 🟡 Yellow dot: Location unknown/error

### Information Panels
1. **Reception Status**: Current LTE availability
2. **Your Location**: GPS coordinates display
3. **About**: Information about 12km coverage rule

### Interactive Map Elements
- User position marker (blue circle with white center)
- Clickable reception zone line with info popup
- Terrain map view for coastal geography

## Setup Requirements

### Environment Variables
Create `.env` file with:
```
GOOGLE_MAPS_API_KEY=your_api_key_here
PORT=3000
```

### Google Maps API Configuration
Required APIs:
- Maps JavaScript API
- Geolocation API (browser-based)

Update `YOUR_GOOGLE_MAPS_API_KEY` in `public/index.html`

### Dependencies Installation
```bash
npm install
```

Installs:
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `geolib` - Geographic distance calculations
- `nodemon` - Development auto-reload (dev dependency)

## Development Commands

```bash
npm start      # Start production server
npm run dev    # Start development server with auto-reload
```

## Technical Implementation Details

### Coordinate System
- Uses decimal degrees (WGS84)
- Latitude: North/South position
- Longitude: East/West position

### Distance Calculation Method
- Uses Haversine formula via geolib
- Returns distance in meters
- Accounts for Earth's curvature

### Offshore Boundary Algorithm
1. Calculate bearing between consecutive coastline points
2. Add 90° to get perpendicular (seaward) bearing
3. Project each point 12km in perpendicular direction
4. Connect projected points to form coverage boundary

### Error Handling
- Geolocation permission denied
- Network connectivity issues
- Invalid GPS coordinates
- Google Maps API loading failures

## Performance Considerations

### Coastline Point Optimization
- Uses 19 key points to represent Norwegian coast
- Balances accuracy vs. performance
- Could be enhanced with higher-resolution data

### API Response Caching
- Backend calculates distance on each request
- No caching implemented (suitable for real-time tracking)
- Could add Redis caching for production scale

## Security Considerations

### CORS Configuration
- Enabled for all origins (development setup)
- Should be restricted to specific domains in production

### Input Validation
- Validates latitude/longitude presence
- Type coercion for numeric values
- No authentication implemented (public service)

## Future Enhancement Opportunities

1. **Real-time Updates**: WebSocket connection for continuous tracking
2. **Historical Tracking**: Store position history and coverage time
3. **Multiple Coverage Zones**: Support for different maritime operators
4. **Mobile App**: React Native or Progressive Web App
5. **Offline Mode**: Cached maps and basic functionality without internet

## Files Created

```
/workspaces/telenor/
├── server.js                 # Backend API server
├── package.json              # Dependencies and scripts
├── .env.example             # Environment template
├── README.md                # User documentation
├── CLAUDE.md               # This technical documentation
└── public/
    ├── index.html          # Main web interface
    └── app.js              # Frontend JavaScript logic
```

## Testing Recommendations

### Manual Testing
1. Test with GPS coordinates on land (should show "outside zone")
2. Test with coordinates >12km offshore (should show "in zone")
3. Test location permission denial handling
4. Test map interaction and info windows

### Example Test Coordinates
- **On land**: 59.9139, 10.7522 (Oslo)
- **Near coast**: 59.9, 10.5 (Oslo fjord)
- **Offshore**: 59.8, 9.0 (North Sea, >12km from coast)

This documentation captures the complete technical implementation of the Telenor Maritime LTE Reception Tracker system.