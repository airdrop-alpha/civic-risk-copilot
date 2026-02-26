require('dotenv').config();
const path = require('path');
const express = require('express');
const { askCopilot } = require('./ai/copilot');
const { getWeatherData, getWeatherAlerts } = require('./data/weather');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/api/weather', async (req, res) => {
  try {
    const weather = await getWeatherData();
    res.json(weather);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weather data', detail: error.message });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await getWeatherAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts', detail: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const result = await askCopilot(message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Chat failed', detail: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Civic Risk Copilot running at http://localhost:${PORT}`);
});
