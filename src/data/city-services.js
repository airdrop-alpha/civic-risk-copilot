const { scrapeCityAnnouncements } = require('./brightdata');

async function getCityServiceUpdates() {
  const result = await scrapeCityAnnouncements();

  return {
    source: result.source,
    mode: result.mode,
    fetchedAt: result.updatedAt,
    announcements: result.announcements,
    note: result.mode === 'brightdata'
      ? 'Scraped with BrightData pipeline.'
      : 'BrightData unavailable or failed; direct scrape fallback used.',
    error: result.error,
  };
}

module.exports = {
  getCityServiceUpdates,
};
