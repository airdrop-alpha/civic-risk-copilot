const { scrapeLocalRiskNews } = require('./brightdata');

async function getLocalNews() {
  try {
    const data = await scrapeLocalRiskNews();

    return {
      ...data,
      total: data.stories.length,
      unavailable: false,
    };
  } catch (error) {
    return {
      source: 'BrightData/local news scrape',
      stories: [],
      errors: [{ source: 'local-news', error: error.message }],
      total: 0,
      unavailable: true,
      updatedAt: new Date().toISOString(),
    };
  }
}

module.exports = {
  getLocalNews,
};
