const axios = require('axios');

const MONTGOMERY_BBOX = '-86.65,32.10,-85.90,32.70';

function parseNumeric(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function classifyGaugeRisk(stageFeet) {
  if (stageFeet == null) return 'unknown';
  if (stageFeet >= 30) return 'severe';
  if (stageFeet >= 24) return 'high';
  if (stageFeet >= 18) return 'moderate';
  return 'low';
}

async function getFloodData() {
  const url = 'https://waterservices.usgs.gov/nwis/iv/';
  const params = {
    format: 'json',
    bBox: MONTGOMERY_BBOX,
    parameterCd: '00065,00060',
    siteType: 'ST',
    siteStatus: 'active',
  };

  const { data } = await axios.get(url, { params, timeout: 15000 });
  const series = data?.value?.timeSeries || [];
  const sites = new Map();

  for (const item of series) {
    const source = item.sourceInfo || {};
    const variable = item.variable || {};
    const values = item.values?.[0]?.value || [];
    const latest = values[values.length - 1] || {};
    const siteCode = source.siteCode?.[0]?.value;
    if (!siteCode) continue;

    const existing = sites.get(siteCode) || {
      siteCode,
      siteName: source.siteName,
      latitude: source.geoLocation?.geogLocation?.latitude,
      longitude: source.geoLocation?.geogLocation?.longitude,
      stageFeet: null,
      dischargeCfs: null,
      observedAt: latest.dateTime || null,
    };

    if (variable.variableCode?.[0]?.value === '00065') {
      existing.stageFeet = parseNumeric(latest.value);
      existing.stageUnit = variable.unit?.unitCode || 'ft';
    }

    if (variable.variableCode?.[0]?.value === '00060') {
      existing.dischargeCfs = parseNumeric(latest.value);
      existing.dischargeUnit = variable.unit?.unitCode || 'ft3/s';
    }

    if (latest.dateTime) {
      existing.observedAt = latest.dateTime;
    }

    sites.set(siteCode, existing);
  }

  const gauges = Array.from(sites.values()).map((g) => ({
    ...g,
    riskLevel: classifyGaugeRisk(g.stageFeet),
  }));

  const highestRisk = gauges.reduce((max, g) => {
    const rank = { unknown: 0, low: 1, moderate: 2, high: 3, severe: 4 };
    return (rank[g.riskLevel] > rank[max]) ? g.riskLevel : max;
  }, 'unknown');

  return {
    source: 'USGS Water Services',
    query: `bBox=${MONTGOMERY_BBOX}`,
    gauges,
    highestRisk,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getFloodData,
  classifyGaugeRisk,
};
