const { getWeatherData, getCombinedAlerts } = require('./weather');
const { getAirQualityData } = require('./air-quality');
const { getFloodData } = require('./flood');
const { getIncidentData } = require('./incidents');
const { getCityServiceUpdates } = require('./city-services');
const { getLocalNews } = require('./news');
const { getEarthquakeData } = require('./earthquakes');

const RISK_RANK = { low: 1, moderate: 2, high: 3, severe: 4, unknown: 0 };

function scoreToLevel(score) {
  if (score >= 75) return 'severe';
  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

function levelToScore(level = 'unknown') {
  const n = String(level).toLowerCase();
  if (n.includes('severe')) return 90;
  if (n.includes('high') || n.includes('unhealthy')) return 70;
  if (n.includes('moderate') || n.includes('sensitive')) return 45;
  if (n.includes('low') || n.includes('good')) return 15;
  return 20;
}

function calculateRiskBreakdown({ alerts, airQuality, flood, weather, earthquakes, incidents }) {
  const alertScoreRaw = Math.min(
    100,
    (alerts?.alerts || []).reduce((sum, alert) => {
      const severity = String(alert.severity || '').toLowerCase();
      if (severity.includes('severe')) return sum + 35;
      if (severity.includes('high')) return sum + 25;
      if (severity.includes('moderate')) return sum + 12;
      return sum + 5;
    }, 0),
  );

  const aqiScoreRaw = (() => {
    const aqi = airQuality?.current?.us_aqi;
    if (aqi == null) return 20;
    if (aqi <= 50) return 10;
    if (aqi <= 100) return 35;
    if (aqi <= 150) return 60;
    if (aqi <= 200) return 80;
    return 95;
  })();

  const floodScoreRaw = Math.max(
    levelToScore(flood?.highestRisk),
    Math.min(
      100,
      ...((flood?.gauges || []).map((g) => Number(g.stageFeet) || 0).map((stage) => stage * 2)),
      0,
    ),
  );

  const heatScoreRaw = (() => {
    const tNow = Number(weather?.current?.temperature_2m);
    const feelsLike = Number(weather?.current?.apparent_temperature);
    const maxForecast = Math.max(...(weather?.daily?.temperature_2m_max || [0]));
    const base = Math.max(tNow || 0, feelsLike || 0, maxForecast || 0);
    if (base >= 42) return 95;
    if (base >= 38) return 78;
    if (base >= 34) return 58;
    if (base >= 30) return 38;
    return 12;
  })();

  const quakeScoreRaw = (() => {
    const magnitude = Number(earthquakes?.maxMagnitude || 0);
    if (magnitude >= 6) return 90;
    if (magnitude >= 5) return 70;
    if (magnitude >= 4) return 45;
    if (magnitude >= 3) return 25;
    return 8;
  })();

  const incidentScoreRaw = (() => {
    const high = incidents?.summary?.high || 0;
    const moderate = incidents?.summary?.moderate || 0;
    return Math.min(100, high * 16 + moderate * 7);
  })();

  const factors = [
    { key: 'alerts', label: 'Official Alerts', weight: 0.24, score: alertScoreRaw, summary: `${(alerts?.alerts || []).length} active alerts` },
    { key: 'flood', label: 'Flood Risk', weight: 0.22, score: floodScoreRaw, summary: `Highest gauge risk: ${flood?.highestRisk || 'unknown'}` },
    { key: 'heatwave', label: 'Heatwave Risk', weight: 0.2, score: heatScoreRaw, summary: `Max expected temp: ${Math.max(...(weather?.daily?.temperature_2m_max || [0])) || 'N/A'}°C` },
    { key: 'airQuality', label: 'Air Quality', weight: 0.16, score: aqiScoreRaw, summary: `US AQI: ${airQuality?.current?.us_aqi ?? 'N/A'}` },
    { key: 'earthquake', label: 'Seismic Activity', weight: 0.1, score: quakeScoreRaw, summary: `7d max magnitude: ${earthquakes?.maxMagnitude || 0}` },
    { key: 'communitySafety', label: 'Community Safety', weight: 0.08, score: incidentScoreRaw, summary: `${incidents?.total || 0} incidents sampled` },
  ];

  const weightedScore = factors.reduce((acc, f) => acc + (f.score * f.weight), 0);
  const overallScore = Math.round(weightedScore);
  const overallRisk = scoreToLevel(overallScore);

  return {
    overallRisk,
    overallScore,
    methodology: 'Weighted multi-hazard model (alerts, flood, heatwave, air quality, earthquake, incidents) normalized to 0-100.',
    factors: factors.map((f) => ({
      ...f,
      level: scoreToLevel(f.score),
      weightedContribution: Number((f.score * f.weight).toFixed(1)),
    })),
  };
}

async function getDashboardData() {
  const tasks = {
    weather: getWeatherData(),
    alerts: getCombinedAlerts(),
    airQuality: getAirQualityData(),
    flood: getFloodData(),
    incidents: getIncidentData(),
    cityServices: getCityServiceUpdates(),
    news: getLocalNews(),
    earthquakes: getEarthquakeData(),
  };

  const entries = await Promise.allSettled(Object.values(tasks));
  const keys = Object.keys(tasks);

  const safe = Object.fromEntries(entries.map((result, idx) => {
    const key = keys[idx];
    if (result.status === 'fulfilled') return [key, result.value];
    return [key, { unavailable: true, error: result.reason?.message || 'source unavailable', updatedAt: new Date().toISOString() }];
  }));

  const risk = calculateRiskBreakdown({
    alerts: safe.alerts,
    airQuality: safe.airQuality,
    flood: safe.flood,
    weather: safe.weather,
    earthquakes: safe.earthquakes,
    incidents: safe.incidents,
  });

  return {
    city: 'Montgomery, AL',
    updatedAt: new Date().toISOString(),
    overallRisk: risk.overallRisk,
    overallScore: risk.overallScore,
    riskBreakdown: risk,
    weather: safe.weather,
    alerts: safe.alerts,
    airQuality: safe.airQuality,
    flood: safe.flood,
    earthquakes: safe.earthquakes,
    incidents: safe.incidents,
    cityServices: safe.cityServices,
    news: safe.news,
    sources: [
      'Open-Meteo Weather API',
      'NWS/NOAA Alerts API',
      'Open-Meteo Air Quality API',
      'USGS Water Services API',
      'USGS Earthquake API',
      'Montgomery PD Open Data (Socrata)',
      'Montgomery City Website',
      'Montgomery Advertiser',
      'WSFA 12 News',
    ],
  };
}


module.exports = {
  getDashboardData,
  calculateRiskBreakdown,
};
