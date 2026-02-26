const axios = require('axios');

const LAT = 32.3668;
const LON = -86.3;
const TZ = 'America/Chicago';

function classifyAqi(aqi) {
  if (aqi == null) return { level: 'unknown', color: 'gray', label: 'Unknown' };
  if (aqi <= 50) return { level: 'good', color: 'green', label: 'Good' };
  if (aqi <= 100) return { level: 'moderate', color: 'yellow', label: 'Moderate' };
  if (aqi <= 150) return { level: 'unhealthy-sensitive', color: 'orange', label: 'Unhealthy for Sensitive Groups' };
  if (aqi <= 200) return { level: 'unhealthy', color: 'red', label: 'Unhealthy' };
  return { level: 'very-unhealthy', color: 'purple', label: 'Very Unhealthy' };
}

async function getAirQualityData() {
  const url = 'https://air-quality-api.open-meteo.com/v1/air-quality';
  const params = {
    latitude: LAT,
    longitude: LON,
    timezone: TZ,
    current: 'us_aqi,pm2_5,pm10,ozone,uv_index',
    daily: 'us_aqi_max,us_aqi_min',
    forecast_days: 7,
  };

  const { data } = await axios.get(url, { params, timeout: 15000 });
  const currentAqi = data?.current?.us_aqi;

  return {
    source: 'Open-Meteo Air Quality API',
    location: 'Montgomery, AL',
    current: data.current,
    current_units: data.current_units,
    daily: data.daily,
    daily_units: data.daily_units,
    classification: classifyAqi(currentAqi),
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getAirQualityData,
  classifyAqi,
};
