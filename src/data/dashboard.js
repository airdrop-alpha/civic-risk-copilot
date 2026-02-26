const { getWeatherData, getCombinedAlerts } = require('./weather');
const { getAirQualityData } = require('./air-quality');
const { getFloodData } = require('./flood');
const { getIncidentData } = require('./incidents');
const { getCityServiceUpdates } = require('./city-services');
const { getLocalNews } = require('./news');

const RISK_RANK = { low: 1, moderate: 2, high: 3, severe: 4, unknown: 0 };

function maxRisk(a, b) {
  return RISK_RANK[a] >= RISK_RANK[b] ? a : b;
}

function toSeverityFromAqi(classification = {}) {
  const level = classification.level || '';
  if (level.includes('very') || level.includes('unhealthy')) return 'high';
  if (level.includes('moderate')) return 'moderate';
  if (level.includes('good')) return 'low';
  return 'unknown';
}

function calculateOverallRisk({ alerts, airQuality, flood, incidents }) {
  let level = 'low';

  for (const alert of (alerts?.alerts || [])) {
    level = maxRisk(level, alert.severity || 'low');
  }

  level = maxRisk(level, toSeverityFromAqi(airQuality?.classification));
  level = maxRisk(level, flood?.highestRisk || 'unknown');

  const highIncidents = (incidents?.summary?.high || 0);
  if (highIncidents >= 3) level = maxRisk(level, 'high');
  if (highIncidents >= 6) level = maxRisk(level, 'severe');

  return level;
}

async function getDashboardData() {
  const [weather, alerts, airQuality, flood, incidents, cityServices, news] = await Promise.all([
    getWeatherData(),
    getCombinedAlerts(),
    getAirQualityData(),
    getFloodData(),
    getIncidentData(),
    getCityServiceUpdates(),
    getLocalNews(),
  ]);

  const overallRisk = calculateOverallRisk({ alerts, airQuality, flood, incidents });

  return {
    city: 'Montgomery, AL',
    updatedAt: new Date().toISOString(),
    overallRisk,
    weather,
    alerts,
    airQuality,
    flood,
    incidents,
    cityServices,
    news,
    sources: [
      'Open-Meteo Weather API',
      'NWS/NOAA Alerts API',
      'Open-Meteo Air Quality API',
      'USGS Water Services API',
      'Montgomery PD Open Data (Socrata)',
      'Montgomery City Website',
      'Montgomery Advertiser',
      'WSFA 12 News',
    ],
  };
}

module.exports = {
  getDashboardData,
  calculateOverallRisk,
};
