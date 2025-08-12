const express = require('express');
const cors = require('cors');
const path = require('path');
const geolib = require('geolib');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/check-reception', (req, res) => {
  const { latitude, longitude } = req.body;
  
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  const userPosition = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
  
  const distanceToCoast = calculateDistanceToCoast(userPosition);
  const inReceptionZone = distanceToCoast >= 12000; // 12km in meters
  
  res.json({
    inReceptionZone,
    distanceToCoast: Math.round(distanceToCoast),
    distanceToCoastKm: Math.round(distanceToCoast / 1000 * 100) / 100,
    message: inReceptionZone 
      ? 'You are in the Telenor Maritime LTE reception zone'
      : `You need to be ${Math.round((12000 - distanceToCoast) / 1000 * 100) / 100}km further offshore for LTE reception`
  });
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

app.listen(PORT, () => {
  console.log(`Telenor Maritime Reception Service running on port ${PORT}`);
});