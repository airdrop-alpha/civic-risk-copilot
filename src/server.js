require('dotenv').config();
const path = require('path');
const express = require('express');
const { askCopilot } = require('./ai/copilot');
const { getWeatherData, getCombinedAlerts } = require('./data/weather');
const { getAirQualityData } = require('./data/air-quality');
const { getFloodData } = require('./data/flood');
const { getIncidentData } = require('./data/incidents');
const { getLocalNews } = require('./data/news');
const { getCityServiceUpdates } = require('./data/city-services');
const { getDashboardData } = require('./data/dashboard');
const { MemoryCache, DEFAULT_TTL_MS } = require('./utils/cache');

const app = express();
const PORT = process.env.PORT || 3000;
const cache = new MemoryCache();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

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
    const data = await cache.wrap('dashboard', () => getDashboardData(), DEFAULT_TTL_MS);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.post('/api/chat', async (req, res, next) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const context = await cache.wrap('dashboard', () => getDashboardData(), DEFAULT_TTL_MS);
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
});
