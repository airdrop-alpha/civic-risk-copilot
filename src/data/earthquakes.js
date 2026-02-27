const axios = require('axios');

const LAT = 32.3668;
const LON = -86.3;
const SEARCH_RADIUS_KM = 300;

function toSeverity(magnitude = 0) {
  if (magnitude >= 6) return 'severe';
  if (magnitude >= 5) return 'high';
  if (magnitude >= 4) return 'moderate';
  return 'low';
}

async function getEarthquakeData() {
  try {
  const endtime = new Date();
  const starttime = new Date(endtime.getTime() - 7 * 24 * 60 * 60 * 1000);
  const f = (d) => d.toISOString().slice(0, 19);

  const { data } = await axios.get('https://earthquake.usgs.gov/fdsnws/event/1/query', {
    params: {
      format: 'geojson',
      starttime: f(starttime),
      endtime: f(endtime),
      latitude: LAT,
      longitude: LON,
      maxradiuskm: SEARCH_RADIUS_KM,
      minmagnitude: 1,
      orderby: 'time',
      limit: 30,
    },
    timeout: 15000,
  });

  const events = (data.features || []).map((feature) => {
    const p = feature.properties || {};
    const [eventLon, eventLat, depthKm] = feature.geometry?.coordinates || [];
    return {
      id: feature.id,
      magnitude: p.mag,
      place: p.place,
      time: p.time ? new Date(p.time).toISOString() : null,
      severity: toSeverity(p.mag || 0),
      feltReports: p.felt || 0,
      tsunami: Boolean(p.tsunami),
      detailUrl: p.url,
      coordinates: {
        latitude: eventLat,
        longitude: eventLon,
        depthKm,
      },
    };
  });

  const maxMagnitude = events.reduce((max, event) => Math.max(max, event.magnitude || 0), 0);

    return {
      source: 'USGS Earthquake Hazards Program',
    windowDays: 7,
    searchRadiusKm: SEARCH_RADIUS_KM,
    total: events.length,
    maxMagnitude,
    severity: toSeverity(maxMagnitude),
    events,
    updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      source: 'USGS Earthquake Hazards Program',
      windowDays: 7,
      searchRadiusKm: SEARCH_RADIUS_KM,
      total: 0,
      maxMagnitude: 0,
      severity: 'low',
      events: [],
      unavailable: true,
      error: error.message,
      updatedAt: new Date().toISOString(),
    };
  }
}

module.exports = {
  getEarthquakeData,
  toSeverity,
};
