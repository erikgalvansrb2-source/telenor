const express = require('express');
const cors = require('cors');
const path = require('path');
const geolib = require('geolib');

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Production CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || false
    : true,
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'telenor-maritime-lte'
  });
});

// API key injection endpoint
app.get('/api/config', (req, res) => {
  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({ error: 'Google Maps API key not configured' });
  }
  
  res.json({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });
});

app.post('/api/check-reception', (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Latitude and longitude required',
        code: 'MISSING_COORDINATES'
      });
    }

    // Validate coordinate values
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ 
        error: 'Invalid latitude or longitude values',
        code: 'INVALID_COORDINATES'
      });
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ 
        error: 'Latitude must be between -90 and 90, longitude between -180 and 180',
        code: 'COORDINATES_OUT_OF_RANGE'
      });
    }

    const userPosition = { latitude: lat, longitude: lng };
    
    const distanceToCoast = calculateDistanceToCoast(userPosition);
    const inReceptionZone = distanceToCoast >= 12000; // 12km in meters
    
    const response = {
      inReceptionZone,
      distanceToCoast: Math.round(distanceToCoast),
      distanceToCoastKm: Math.round(distanceToCoast / 1000 * 100) / 100,
      message: inReceptionZone 
        ? 'You are in the Telenor Maritime LTE reception zone'
        : `You need to be ${Math.round((12000 - distanceToCoast) / 1000 * 100) / 100}km further offshore for LTE reception`,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Error processing reception check:', error);
    res.status(500).json({ 
      error: 'Internal server error while checking reception status',
      code: 'INTERNAL_ERROR'
    });
  }
});

function calculateDistanceToCoast(position) {
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
    const distance = geolib.getDistance(position, point);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }
  
  return minDistance;
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

const server = app.listen(PORT, () => {
  console.log(`🚢 Telenor Maritime Reception Service`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗺️  Google Maps API: ${GOOGLE_MAPS_API_KEY ? 'Configured' : 'Missing'}`);
  
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️  Warning: GOOGLE_MAPS_API_KEY not set - maps will not work');
  }
});

module.exports = server;