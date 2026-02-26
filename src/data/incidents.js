const axios = require('axios');

const SOCrATA_CATALOG_URL = 'https://api.us.socrata.com/api/catalog/v1';

function pickField(row, names) {
  for (const name of names) {
    if (row[name] != null && row[name] !== '') return row[name];
  }
  return null;
}

function inferSeverity(typeText = '') {
  const t = String(typeText).toLowerCase();
  if (/homicide|shooting|armed|assault|robbery|violent|weapon/.test(t)) return 'high';
  if (/burglary|theft|break|vandalism|battery|drugs/.test(t)) return 'moderate';
  return 'low';
}

function normalizeIncident(row, index) {
  const type = pickField(row, [
    'offense',
    'offense_description',
    'incident_type',
    'ucr_desc',
    'description',
    'title',
  ]) || 'Incident';

  const date = pickField(row, [
    'incident_date',
    'occurred_on_date',
    'report_date',
    'date',
    'created_at',
    ':created_at',
  ]);

  const location = pickField(row, [
    'block_address',
    'address',
    'location',
    'street',
    'intersection',
    'beat',
  ]);

  return {
    id: pickField(row, ['incident_number', 'case_number', 'id']) || `inc-${index + 1}`,
    type,
    severity: inferSeverity(type),
    location: location || 'Montgomery area',
    time: date,
    details: pickField(row, ['description', 'narrative', 'notes']) || null,
  };
}

async function discoverMontgomeryDataset() {
  const { data } = await axios.get(SOCrATA_CATALOG_URL, {
    params: {
      search_context: 'data.montgomeryal.gov',
      q: 'police incident crime',
      limit: 20,
    },
    timeout: 15000,
  });

  const results = data.results || [];
  const ranked = results
    .filter((r) => r.resource?.id)
    .map((r) => {
      const text = `${r.resource?.name || ''} ${r.resource?.description || ''}`.toLowerCase();
      let score = 0;
      if (text.includes('police')) score += 3;
      if (text.includes('incident')) score += 3;
      if (text.includes('crime')) score += 2;
      if (text.includes('call')) score += 1;
      return { result: r, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.result || null;
}

async function getIncidentData() {
  const dataset = await discoverMontgomeryDataset();
  if (!dataset) {
    return {
      source: 'Montgomery open data (Socrata catalog)',
      dataset: null,
      incidents: [],
      total: 0,
      note: 'No incident dataset discovered at runtime.',
      updatedAt: new Date().toISOString(),
    };
  }

  const datasetId = dataset.resource.id;
  const rowsUrl = `https://data.montgomeryal.gov/resource/${datasetId}.json`;

  const { data: rows } = await axios.get(rowsUrl, {
    params: {
      $limit: 25,
      $order: ':updated_at DESC',
    },
    timeout: 15000,
  });

  const incidents = (rows || []).map(normalizeIncident);
  const summary = incidents.reduce((acc, inc) => {
    acc[inc.severity] = (acc[inc.severity] || 0) + 1;
    return acc;
  }, {});

  return {
    source: 'Montgomery PD open data (Socrata)',
    dataset: {
      id: datasetId,
      name: dataset.resource?.name,
      description: dataset.resource?.description,
    },
    incidents,
    total: incidents.length,
    summary,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getIncidentData,
};
