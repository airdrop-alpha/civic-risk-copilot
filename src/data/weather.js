const axios = require('axios');

const LAT = 32.3668;
const LON = -86.3;
const TZ = 'America/Chicago';

const WEATHER_CODE_MAP = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm with hail',
};

function getWeatherDescription(code) {
  return WEATHER_CODE_MAP[code] || 'Unknown';
}

async function getWeatherData() {
  const url = 'https://api.open-meteo.com/v1/forecast';
  const params = {
    latitude: LAT,
    longitude: LON,
    timezone: TZ,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
    forecast_days: 7,
  };

  const { data } = await axios.get(url, { params, timeout: 15000 });

  return {
    source: 'Open-Meteo',
    location: {
      name: 'Montgomery, AL',
      latitude: LAT,
      longitude: LON,
      timezone: data.timezone,
    },
    current: {
      ...data.current,
      weather_description: getWeatherDescription(data.current?.weather_code),
    },
    daily: data.daily,
    daily_units: data.daily_units,
    current_units: data.current_units,
    updatedAt: new Date().toISOString(),
  };
}

function buildForecastAlerts(weather) {
  const alerts = [];
  const dates = weather?.daily?.time || [];
  const precip = weather?.daily?.precipitation_probability_max || [];
  const wind = weather?.daily?.wind_speed_10m_max || [];
  const tMax = weather?.daily?.temperature_2m_max || [];

  for (let i = 0; i < dates.length; i += 1) {
    if ((precip[i] || 0) >= 70) {
      alerts.push({
        source: 'Open-Meteo Forecast',
        severity: 'moderate',
        type: 'Heavy Rain Risk',
        date: dates[i],
        detail: `Precipitation probability may reach ${precip[i]}%.`,
      });
    }

    if ((wind[i] || 0) >= 45) {
      alerts.push({
        source: 'Open-Meteo Forecast',
        severity: 'high',
        type: 'Strong Wind Risk',
        date: dates[i],
        detail: `Wind speeds could reach ${wind[i]} ${weather?.daily_units?.wind_speed_10m_max || 'km/h'}.`,
      });
    }

    if ((tMax[i] || 0) >= 36) {
      alerts.push({
        source: 'Open-Meteo Forecast',
        severity: 'moderate',
        type: 'Heat Risk',
        date: dates[i],
        detail: `Daily high may reach ${tMax[i]} ${weather?.daily_units?.temperature_2m_max || '°C'}.`,
      });
    }
  }

  return alerts;
}

function mapNwsSeverity(severity = '') {
  const s = severity.toLowerCase();
  if (s.includes('extreme')) return 'severe';
  if (s.includes('severe')) return 'high';
  if (s.includes('moderate')) return 'moderate';
  return 'low';
}

async function getNwsAlerts() {
  const url = 'https://api.weather.gov/alerts/active';
  const params = { area: 'AL' };

  const { data } = await axios.get(url, {
    params,
    timeout: 15000,
    headers: {
      Accept: 'application/geo+json',
      'User-Agent': 'CivicRiskCopilot/1.0 (hackathon project)',
    },
  });

  const features = data.features || [];

  const alerts = features.map((item) => {
    const p = item.properties || {};
    const areaDesc = p.areaDesc || '';
    const relevant = /montgomery/i.test(areaDesc);

    return {
      id: p.id || item.id,
      source: 'NWS/NOAA',
      event: p.event,
      headline: p.headline,
      severity: mapNwsSeverity(p.severity),
      urgency: p.urgency,
      certainty: p.certainty,
      areas: areaDesc,
      effective: p.effective,
      ends: p.ends,
      instruction: p.instruction,
      description: p.description,
      relevantToMontgomery: relevant,
    };
  });

  return {
    source: 'https://api.weather.gov/alerts/active?area=AL',
    total: alerts.length,
    montgomeryRelevant: alerts.filter((a) => a.relevantToMontgomery).length,
    alerts,
    updatedAt: new Date().toISOString(),
  };
}

async function getCombinedAlerts() {
  const [weather, nws] = await Promise.all([getWeatherData(), getNwsAlerts()]);
  const forecastAlerts = buildForecastAlerts(weather);

  return {
    source: ['NWS/NOAA', 'Open-Meteo forecast'],
    alerts: [
      ...nws.alerts,
      ...forecastAlerts,
    ],
    counts: {
      nws: nws.total,
      forecast: forecastAlerts.length,
    },
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getWeatherData,
  getNwsAlerts,
  getCombinedAlerts,
  buildForecastAlerts,
  getWeatherDescription,
};
