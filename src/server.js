require('dotenv').config();
const path = require('path');
const express = require('express');
const { askCopilot } = require('./ai/copilot');
const { getWeatherData, getCombinedAlerts } = require('./data/weather');
const { getAirQualityData } = require('./data/air-quality');
const { getFloodData } = require('./data/flood');
const { getEarthquakeData } = require('./data/earthquakes');
const { getIncidentData } = require('./data/incidents');
const { getLocalNews } = require('./data/news');
const { getCityServiceUpdates } = require('./data/city-services');
const { getDashboardData } = require('./data/dashboard');
const { MemoryCache, DEFAULT_TTL_MS } = require('./utils/cache');

const app = express();
const PORT = process.env.PORT || 3000;
const cache = new MemoryCache();
const SNAPSHOT_LIMIT = 24;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const STREAM_KEEPALIVE_MS = 30 * 1000;

const dashboardHistory = [];
const sseClients = new Set();
let latestLiveSnapshot = null;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

function pushHistory(snapshot) {
  const existing = dashboardHistory[0];
  if (existing?.updatedAt === snapshot.updatedAt && existing?.overallScore === snapshot.overallScore) {
    return;
  }

  dashboardHistory.unshift({
    capturedAt: new Date().toISOString(),
    overallRisk: snapshot.overallRisk,
    overallScore: snapshot.overallScore,
    riskTrend: snapshot.riskTrend,
    riskBreakdown: snapshot.riskBreakdown,
    sourceStatus: snapshot.sourceStatus,
    weather: snapshot.weather,
    alerts: snapshot.alerts,
    airQuality: snapshot.airQuality,
    flood: snapshot.flood,
    earthquakes: snapshot.earthquakes,
    incidents: snapshot.incidents,
    cityServices: snapshot.cityServices,
    news: snapshot.news,
    updatedAt: snapshot.updatedAt,
  });

  if (dashboardHistory.length > SNAPSHOT_LIMIT) {
    dashboardHistory.length = SNAPSHOT_LIMIT;
  }
}

function writeSse(client, event, data) {
  client.write(`event: ${event}\n`);
  client.write(`data: ${JSON.stringify(data)}\n\n`);
}

function broadcastSse(event, data) {
  for (const client of sseClients) {
    writeSse(client, event, data);
  }
}

function getDemoPayload() {
  const now = new Date();
  const dailyTimes = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(now);
    date.setDate(now.getDate() + idx);
    return date.toISOString().slice(0, 10);
  });

  return {
    city: 'Montgomery, AL',
    updatedAt: now.toISOString(),
    overallRisk: 'severe',
    overallScore: 89,
    riskBreakdown: {
      overallRisk: 'severe',
      overallScore: 89,
      methodology: 'Demo mode weighted multi-hazard model.',
      factors: [
        { key: 'alerts', label: 'Official Alerts', weight: 0.24, score: 94, level: 'severe', summary: '4 active alerts', weightedContribution: 22.6 },
        { key: 'flood', label: 'Flood Risk', weight: 0.22, score: 88, level: 'severe', summary: 'River gauges near action stage', weightedContribution: 19.4 },
        { key: 'heatwave', label: 'Heatwave Risk', weight: 0.2, score: 91, level: 'severe', summary: 'Heat index expected above 107F', weightedContribution: 18.2 },
        { key: 'airQuality', label: 'Air Quality', weight: 0.16, score: 76, level: 'high', summary: 'US AQI: 164', weightedContribution: 12.2 },
        { key: 'earthquake', label: 'Seismic Activity', weight: 0.1, score: 18, level: 'low', summary: 'No significant seismic activity', weightedContribution: 1.8 },
        { key: 'communitySafety', label: 'Community Safety', weight: 0.08, score: 62, level: 'high', summary: 'Elevated overnight incidents', weightedContribution: 5 },
      ],
    },
    riskTrend: [89, 92, 90, 84, 79, 73, 68].map((score, idx) => ({
      date: dailyTimes[idx],
      score,
      level: score >= 75 ? 'severe' : score >= 50 ? 'high' : 'moderate',
    })),
    weather: {
      updatedAt: now.toISOString(),
      current: {
        weather_description: 'Hot and humid with thunderstorms nearby',
        temperature_2m: 37,
        apparent_temperature: 41,
        wind_speed_10m: 22,
        relative_humidity_2m: 68,
      },
      current_units: {
        temperature_2m: 'C',
        apparent_temperature: 'C',
        wind_speed_10m: 'km/h',
        relative_humidity_2m: '%',
      },
      daily: {
        time: dailyTimes,
        temperature_2m_max: [39, 40, 39, 37, 35, 34, 33],
        temperature_2m_min: [27, 28, 27, 26, 24, 23, 23],
        precipitation_probability_max: [80, 85, 70, 55, 40, 35, 30],
      },
      daily_units: {
        temperature_2m_max: 'C',
        precipitation_probability_max: '%',
      },
    },
    alerts: {
      updatedAt: now.toISOString(),
      alerts: [
        { event: 'Severe Thunderstorm Warning', severity: 'severe', headline: 'Damaging winds and flash flooding likely in Montgomery metro.' },
        { event: 'Heat Advisory', severity: 'high', headline: 'Dangerous heat index through evening.' },
        { event: 'Flood Watch', severity: 'high', headline: 'Rapid rises possible along local creeks and rivers.' },
      ],
    },
    airQuality: {
      updatedAt: now.toISOString(),
      current: { us_aqi: 164, pm2_5: 69.4, ozone: 126 },
      current_units: { pm2_5: 'ug/m3', ozone: 'ug/m3' },
      classification: { level: 'high', label: 'Unhealthy' },
    },
    flood: {
      updatedAt: now.toISOString(),
      highestRisk: 'high',
      gauges: [
        { siteName: 'Alabama River at Montgomery', stageFeet: 26.4, stageUnit: 'ft', dischargeCfs: 70300, dischargeUnit: 'cfs', riskLevel: 'high' },
        { siteName: 'Catoma Creek at South Blvd', stageFeet: 12.1, stageUnit: 'ft', dischargeCfs: 5500, dischargeUnit: 'cfs', riskLevel: 'moderate' },
      ],
    },
    earthquakes: {
      updatedAt: now.toISOString(),
      total: 1,
      maxMagnitude: 1.2,
      severity: 'low',
      events: [{ magnitude: 1.2, place: 'Near central Alabama', time: now.toISOString(), severity: 'low' }],
    },
    incidents: {
      updatedAt: now.toISOString(),
      total: 12,
      summary: { high: 3, moderate: 4, low: 5 },
      incidents: [
        { type: 'Traffic Collision', severity: 'high', location: 'I-85 SB near Exit 6', time: now.toISOString() },
        { type: 'Road Closure', severity: 'moderate', location: 'Carter Hill Rd and Narrow Lane', time: now.toISOString() },
      ],
    },
    cityServices: {
      updatedAt: now.toISOString(),
      note: 'Demo notices for hackathon presentation.',
      announcements: [
        { title: 'Cooling centers open citywide', link: 'https://www.montgomeryal.gov/' },
        { title: 'Sandbag pickup locations available', link: 'https://www.montgomeryal.gov/' },
      ],
    },
    news: {
      updatedAt: now.toISOString(),
      stories: [
        { title: 'Storm response teams staged across Montgomery County', source: 'WSFA 12', link: 'https://www.wsfa.com/' },
        { title: 'City opens emergency cooling and hydration stations', source: 'Montgomery Advertiser', link: 'https://www.montgomeryadvertiser.com/' },
      ],
    },
    sourceStatus: {
      weather: { status: 'demo', message: 'demo mode' },
      alerts: { status: 'demo', message: 'demo mode' },
      airQuality: { status: 'demo', message: 'demo mode' },
      flood: { status: 'demo', message: 'demo mode' },
      incidents: { status: 'demo', message: 'demo mode' },
      cityServices: { status: 'demo', message: 'demo mode' },
      news: { status: 'demo', message: 'demo mode' },
      earthquakes: { status: 'demo', message: 'demo mode' },
    },
    sources: [
      'Demo Mode: Preloaded high-risk scenario',
      'Open-Meteo Weather API',
      'NWS/NOAA Alerts API',
      'USGS Water Services API',
      'USGS Earthquake API',
    ],
  };
}

async function fetchAndStoreDashboard(options = {}) {
  const { forceRefresh = false, useDemo = false } = options;

  let snapshot;
  if (useDemo) {
    snapshot = getDemoPayload();
    return { ...snapshot, mode: 'demo' };
  } else if (forceRefresh) {
    snapshot = await getDashboardData();
    cache.set('dashboard', snapshot, DEFAULT_TTL_MS);
  } else {
    snapshot = await cache.wrap('dashboard', () => getDashboardData(), DEFAULT_TTL_MS);
  }

  latestLiveSnapshot = snapshot;
  pushHistory(snapshot);
  return snapshot;
}

setInterval(async () => {
  try {
    const snapshot = await fetchAndStoreDashboard({ forceRefresh: true });
    broadcastSse('dashboard-update', snapshot);
  } catch (error) {
    broadcastSse('dashboard-error', {
      message: 'dashboard refresh failed',
      detail: error.message,
      time: new Date().toISOString(),
    });
    console.error(`[${new Date().toISOString()}] scheduled refresh failed:`, error.message);
  }
}, REFRESH_INTERVAL_MS);

setInterval(() => {
  broadcastSse('ping', { time: new Date().toISOString() });
}, STREAM_KEEPALIVE_MS);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'civic-risk-copilot',
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    cache: cache.stats(),
    stream: {
      clients: sseClients.size,
      refreshIntervalMs: REFRESH_INTERVAL_MS,
    },
    history: {
      retainedSnapshots: dashboardHistory.length,
      limit: SNAPSHOT_LIMIT,
    },
    latestLiveSnapshotAt: latestLiveSnapshot?.updatedAt || null,
    env: {
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      brightDataConfigured: Boolean(process.env.BRIGHT_DATA_API_KEY),
    },
  });
});

app.get('/api/weather', async (req, res, next) => {
  try {
    const data = await cache.wrap('weather', () => getWeatherData(), DEFAULT_TTL_MS);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/alerts', async (req, res, next) => {
  try {
    const data = await cache.wrap('alerts', () => getCombinedAlerts(), DEFAULT_TTL_MS);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/air-quality', async (req, res, next) => {
  try {
    const data = await cache.wrap('air-quality', () => getAirQualityData(), DEFAULT_TTL_MS);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/flood', async (req, res, next) => {
  try {
    const data = await cache.wrap('flood', () => getFloodData(), DEFAULT_TTL_MS);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/earthquakes', async (req, res, next) => {
  try {
    const data = await cache.wrap('earthquakes', () => getEarthquakeData(), DEFAULT_TTL_MS);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/incidents', async (req, res, next) => {
  try {
    const data = await cache.wrap('incidents', () => getIncidentData(), DEFAULT_TTL_MS);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/news', async (req, res, next) => {
  try {
    const data = await cache.wrap('news', () => getLocalNews(), DEFAULT_TTL_MS);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/city-services', async (req, res, next) => {
  try {
    const data = await cache.wrap('city-services', () => getCityServiceUpdates(), DEFAULT_TTL_MS);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/dashboard', async (req, res, next) => {
  try {
    const useDemo = req.query.mode === 'demo';
    const data = await fetchAndStoreDashboard({ useDemo });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/history', (req, res) => {
  res.json({
    count: dashboardHistory.length,
    limit: SNAPSHOT_LIMIT,
    snapshots: dashboardHistory,
  });
});

app.get('/api/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);
  writeSse(res, 'connected', {
    message: 'stream connected',
    time: new Date().toISOString(),
    intervalMs: REFRESH_INTERVAL_MS,
  });

  try {
    const initial = dashboardHistory[0] || await fetchAndStoreDashboard();
    writeSse(res, 'dashboard-update', initial);
  } catch (error) {
    writeSse(res, 'dashboard-error', {
      message: 'initial dashboard fetch failed',
      detail: error.message,
      time: new Date().toISOString(),
    });
  }

  req.on('close', () => {
    sseClients.delete(res);
  });
});

app.get('/demo', (req, res) => {
  res.json(getDemoPayload());
});

app.post('/api/chat', async (req, res, next) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const context = latestLiveSnapshot || dashboardHistory[0] || await fetchAndStoreDashboard();
    const result = await askCopilot(message, context);
    return res.json({
      ...result,
      contextSummary: {
        overallRisk: context.overallRisk,
        updatedAt: context.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const payload = {
    error: err.publicMessage || 'Internal server error',
    detail: process.env.NODE_ENV === 'production' ? undefined : err.message,
    route: req.originalUrl,
    time: new Date().toISOString(),
  };

  if (status >= 500) {
    console.error(`[${payload.time}] ${req.method} ${req.originalUrl}:`, err.message);
  }

  res.status(status).json(payload);
});

app.listen(PORT, () => {
  console.log(`Civic Risk Copilot running at http://localhost:${PORT}`);

  fetchAndStoreDashboard().catch((error) => {
    console.error(`[${new Date().toISOString()}] startup dashboard warm-up failed:`, error.message);
  });
});
