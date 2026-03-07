const { scrapeCityAnnouncements } = require('./brightdata');

async function getCityServiceUpdates() {
  try {
    const result = await scrapeCityAnnouncements();

    return {
      source: result.source,
      mode: result.mode,
      fetchedAt: result.updatedAt,
      updatedAt: result.updatedAt,
      announcements: result.announcements,
      note: result.mode === 'brightdata'
        ? 'Scraped with BrightData pipeline.'
        : 'BrightData unavailable or failed; direct scrape fallback used.',
      error: result.error,
      unavailable: false,
    };
  } catch (error) {
    return {
      source: 'https://www.montgomeryal.gov',
      mode: 'fallback',
      fetchedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      announcements: [],
      note: 'City service updates are temporarily unavailable.',
      error: error.message,
      unavailable: true,
    };
  }
}

module.exports = {
  getCityServiceUpdates,
};
