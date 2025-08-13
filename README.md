# Telenor Maritime LTE Reception Tracker

A web application that displays Telenor Maritime LTE reception zones for cruise ships, showing coverage areas that begin approximately 12km from the Norwegian coast.

## Features

- **Interactive Google Maps**: Shows Norwegian coastline and LTE coverage zones
- **GPS Location Tracking**: Real-time user position detection
- **Reception Zone Verification**: Determines if user is within LTE coverage area
- **Visual Indicators**: Clear status display for reception availability
- **Distance Calculation**: Shows exact distance from coast and coverage zone


2. **Configure Google Maps API**:
   - Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Copy `.env.example` to `.env` and add your API key
   - Update `YOUR_GOOGLE_MAPS_API_KEY` in `public/index.html` with your key


### POST `/api/check-reception`
Checks if a GPS coordinate is within the LTE reception zone.

**Request Body**:
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

## How It Works

1. **Coastline Data**: Uses predefined Norwegian coastline coordinates
2. **Coverage Zone**: Calculates 12km offshore boundary from coastline points
3. **GPS Tracking**: Gets user location via browser geolocation API
4. **Distance Calculation**: Uses geolib to calculate distances to nearest coast point
5. **Zone Detection**: Determines reception availability based on 12km threshold

## File Structure

```
├── server.js              # Express server and API endpoints
├── package.json           # Project dependencies
├── public/
│   ├── index.html         # Main HTML interface
│   └── app.js             # Frontend JavaScript logic
├── .env.example           # Environment variables template
└── README.md              # This file
```

## Requirements

- Node.js 14+
- Google Maps API key with Maps JavaScript API enabled
- Modern web browser with geolocation support

## Usage

1. Open the application in a web browser
2. Allow location access when prompted
3. View your position on the map relative to the LTE coverage zone
4. The blue line shows the 12km offshore boundary where LTE coverage begins
5. Status indicator shows whether you're in the reception zone
6. Distance information helps track your proximity to coverage area