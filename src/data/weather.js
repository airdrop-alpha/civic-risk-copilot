const axios = require('axios');

const LAT = 32.3668;
const LON = -86.3;
const TZ = 'America/Chicago';

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
    location: {
      name: 'Montgomery, AL',
      latitude: LAT,
      longitude: LON,
      timezone: data.timezone,
    },
    current: data.current,
    daily: data.daily,
    daily_units: data.daily_units,
    current_units: data.current_units,
    updatedAt: new Date().toISOString(),
  };
}

async function getWeatherAlerts() {
  const url = 'https://api.open-meteo.com/v1/forecast';
  const params = {
    latitude: LAT,
    longitude: LON,
    timezone: TZ,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
    forecast_days: 7,
  };

  const { data } = await axios.get(url, { params, timeout: 15000 });
  const alerts = [];

  const dates = data.daily.time || [];
  const precip = data.daily.precipitation_probability_max || [];
  const wind = data.daily.wind_speed_10m_max || [];
  const tMax = data.daily.temperature_2m_max || [];

  for (let i = 0; i < dates.length; i += 1) {
    if ((precip[i] || 0) >= 70) {
      alerts.push({
        level: 'watch',
        type: 'Heavy Rain Risk',
        date: dates[i],
        detail: `Precipitation probability may reach ${precip[i]}%.`,
      });
    }

    if ((wind[i] || 0) >= 40) {
      alerts.push({
        level: 'warning',
        type: 'Strong Wind Risk',
        date: dates[i],
        detail: `Wind speeds could reach ${wind[i]} ${data.daily_units.wind_speed_10m_max}.`,
      });
    }

    if ((tMax[i] || 0) >= 35) {
      alerts.push({
        level: 'watch',
        type: 'Heat Risk',
        date: dates[i],
        detail: `High temperature could reach ${tMax[i]} ${data.daily_units.temperature_2m_max}.`,
      });
    }
  }

  return {
    location: 'Montgomery, AL',
    source: 'Open-Meteo forecast-derived alerts',
    alerts,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getWeatherData,
  getWeatherAlerts,
};
