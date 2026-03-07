const { getWeatherData, getCombinedAlerts } = require('./weather');
const { getAirQualityData } = require('./air-quality');
const { getFloodData } = require('./flood');
const { getIncidentData } = require('./incidents');
const { getCityServiceUpdates } = require('./city-services');
const { getLocalNews } = require('./news');
const { getEarthquakeData } = require('./earthquakes');

const RISK_RANK = { low: 1, moderate: 2, high: 3, severe: 4, unknown: 0 };
const sourceFallbackCache = new Map();

function summarizeSourceHealth(sourceStatus = {}) {
  const counts = { live: 0, stale: 0, unavailable: 0, demo: 0 };
  for (const meta of Object.values(sourceStatus)) {
    const key = meta?.status || 'unavailable';
    counts[key] = (counts[key] || 0) + 1;
  }

  const total = Object.keys(sourceStatus).length || 1;
  const confidenceScore = Math.max(20, Math.round(((counts.live * 1) + (counts.stale * 0.55) + (counts.demo * 0.7)) / total * 100));

  return {
    counts,
    total,
    confidenceScore,
    summary: counts.unavailable > 0
      ? `${counts.live}/${total} live, ${counts.unavailable} unavailable`
      : `${counts.live}/${total} sources live`,
  };
}

function buildHeroStats({ alerts, airQuality, flood, incidents, sourceHealth }) {
  return [
    { label: 'Active Alerts', value: (alerts?.alerts || []).length, tone: (alerts?.alerts || []).length > 0 ? 'high' : 'low' },
    { label: 'Air Quality', value: airQuality?.current?.us_aqi ?? 'N/A', tone: scoreToLevel(levelToScore(airQuality?.classification?.level)) },
    { label: 'Flood Risk', value: String(flood?.highestRisk || 'unknown').toUpperCase(), tone: flood?.highestRisk || 'unknown' },
    { label: 'Data Confidence', value: `${sourceHealth.confidenceScore}%`, tone: sourceHealth.confidenceScore >= 75 ? 'low' : sourceHealth.confidenceScore >= 50 ? 'moderate' : 'high' },
    { label: 'Incidents', value: incidents?.total ?? 0, tone: (incidents?.summary?.high || 0) > 0 ? 'high' : 'moderate' },
  ];
}

function buildActionBrief({ overallRisk, riskBreakdown, alerts, airQuality, flood, weather, incidents, cityServices, sourceHealth }) {
  const actions = [];
  const watchList = [];
  const topFactors = (riskBreakdown?.factors || []).slice().sort((a, b) => b.score - a.score).slice(0, 3);

  if ((alerts?.alerts || []).length > 0) {
    actions.push('Review official alerts and avoid areas named in active warnings before travel or outdoor plans.');
    watchList.push((alerts.alerts[0].event || alerts.alerts[0].type || 'Active alert').trim());
  }

  if (String(flood?.highestRisk || '').match(/moderate|high|severe/i)) {
    actions.push('Avoid low-lying roads and monitor river gauges as storms move through Montgomery.');
    if ((flood?.gauges || []).length) {
      watchList.push(`${flood.gauges[0].siteName || 'Top gauge'} at ${flood.gauges[0].stageFeet ?? '--'} ${flood.gauges[0].stageUnit || 'ft'}`);
    }
  }

  const apparentTemp = Number(weather?.current?.apparent_temperature || weather?.current?.temperature_2m || 0);
  if (apparentTemp >= 34) {
    actions.push('Shift strenuous outdoor work earlier or later and keep hydration / cooling resources ready.');
    watchList.push(`Heat stress at ${apparentTemp}°C apparent temperature`);
  }

  if (Number(airQuality?.current?.us_aqi || 0) >= 100) {
    actions.push('Reduce prolonged outdoor exertion for sensitive groups while AQI remains elevated.');
    watchList.push(`AQI ${airQuality.current.us_aqi}`);
  }

  if ((incidents?.summary?.high || 0) > 0) {
    actions.push('Stage communications around higher-activity safety zones and recommend well-lit routes after dark.');
  }

  if ((cityServices?.announcements || []).length > 0) {
    watchList.push(cityServices.announcements[0].title);
  }

  if (!actions.length) {
    actions.push('Maintain routine monitoring; no single signal currently dominates the civic risk picture.');
  }

  return {
    headline: overallRisk === 'severe'
      ? 'Conditions merit active response posture.'
      : overallRisk === 'high'
        ? 'Multiple signals warrant extra caution today.'
        : 'City conditions are stable, but stay situationally aware.',
    topFactors: topFactors.map((factor) => factor.label),
    actions: actions.slice(0, 4),
    watchList: watchList.slice(0, 4),
    sourceConfidence: sourceHealth.confidenceScore,
  };
}

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

function buildRiskTrend({ weather, alerts, overallScore }) {
  const days = weather?.daily?.time || [];
  const highs = weather?.daily?.temperature_2m_max || [];
  const rainChance = weather?.daily?.precipitation_probability_max || [];
  const alertRisk = Math.min(20, (alerts?.alerts || []).length * 4);

  return days.slice(0, 7).map((day, idx) => {
    const high = Number(highs[idx] || 0);
    const rain = Number(rainChance[idx] || 0);
    const heatRisk = high >= 38 ? 18 : high >= 34 ? 12 : high >= 30 ? 8 : 2;
    const rainRisk = rain >= 80 ? 14 : rain >= 60 ? 10 : rain >= 40 ? 6 : 2;
    const score = Math.max(5, Math.min(100, Math.round((overallScore * 0.6) + heatRisk + rainRisk + alertRisk)));

    return {
      date: day,
      score,
      level: scoreToLevel(score),
    };
  });
}

async function getDashboardData() {
  const tasks = {
    weather: getWeatherData,
    alerts: getCombinedAlerts,
    airQuality: getAirQualityData,
    flood: getFloodData,
    incidents: getIncidentData,
    cityServices: getCityServiceUpdates,
    news: getLocalNews,
    earthquakes: getEarthquakeData,
  };

  const entries = await Promise.allSettled(Object.values(tasks).map((producer) => producer()));
  const keys = Object.keys(tasks);
  const sourceStatus = {};

  const safe = Object.fromEntries(entries.map((result, idx) => {
    const key = keys[idx];
    const fulfilled = result.status === 'fulfilled';
    const value = fulfilled ? result.value : null;
    const message = fulfilled ? value?.error : result.reason?.message;

    if (fulfilled && !value?.unavailable) {
      sourceFallbackCache.set(key, value);
      sourceStatus[key] = { status: 'live', message: 'live data' };
      return [key, value];
    }

    const stale = sourceFallbackCache.get(key);
    if (stale) {
      sourceStatus[key] = { status: 'stale', message: message || 'using last successful snapshot' };
      return [key, { ...stale, stale: true, fallbackReason: sourceStatus[key].message }];
    }

    sourceStatus[key] = { status: 'unavailable', message: message || 'source unavailable' };
    return [key, { ...(value || {}), unavailable: true, error: sourceStatus[key].message, updatedAt: value?.updatedAt || new Date().toISOString() }];
  }));

  const risk = calculateRiskBreakdown({
    alerts: safe.alerts,
    airQuality: safe.airQuality,
    flood: safe.flood,
    weather: safe.weather,
    earthquakes: safe.earthquakes,
    incidents: safe.incidents,
  });
  const riskTrend = buildRiskTrend({
    weather: safe.weather,
    alerts: safe.alerts,
    overallScore: risk.overallScore,
  });
  const sourceHealth = summarizeSourceHealth(sourceStatus);
  const briefing = buildActionBrief({
    overallRisk: risk.overallRisk,
    riskBreakdown: risk,
    alerts: safe.alerts,
    airQuality: safe.airQuality,
    flood: safe.flood,
    weather: safe.weather,
    incidents: safe.incidents,
    cityServices: safe.cityServices,
    sourceHealth,
  });

  return {
    city: 'Montgomery, AL',
    updatedAt: new Date().toISOString(),
    overallRisk: risk.overallRisk,
    overallScore: risk.overallScore,
    riskBreakdown: risk,
    riskTrend,
    weather: safe.weather,
    alerts: safe.alerts,
    airQuality: safe.airQuality,
    flood: safe.flood,
    earthquakes: safe.earthquakes,
    incidents: safe.incidents,
    cityServices: safe.cityServices,
    news: safe.news,
    sourceStatus,
    sourceHealth,
    heroStats: buildHeroStats({ alerts: safe.alerts, airQuality: safe.airQuality, flood: safe.flood, incidents: safe.incidents, sourceHealth }),
    briefing,
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
