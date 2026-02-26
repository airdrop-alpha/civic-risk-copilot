const axios = require('axios');

async function getCityServiceUpdates() {
  const sourceUrl = 'https://www.montgomeryal.gov';

  try {
    const response = await axios.get(sourceUrl, { timeout: 15000 });
    const html = response.data || '';

    const titleMatches = [...html.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi)]
      .slice(0, 6)
      .map((m) => (m[1] || '').replace(/<[^>]*>/g, '').trim())
      .filter(Boolean);

    return {
      source: sourceUrl,
      fetchedAt: new Date().toISOString(),
      announcements: titleMatches.map((title, index) => ({
        id: `montgomery-${index + 1}`,
        title,
        category: 'city-announcement',
      })),
      note: 'MVP parser. Replace with BrightData pipeline for robust structured extraction.',
    };
  } catch (error) {
    return {
      source: sourceUrl,
      fetchedAt: new Date().toISOString(),
      announcements: [],
      note: 'Unable to fetch live city data right now. Placeholder structure returned for MVP.',
      error: error.message,
    };
  }
}

module.exports = {
  getCityServiceUpdates,
};
