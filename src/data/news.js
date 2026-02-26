const { scrapeLocalRiskNews } = require('./brightdata');

async function getLocalNews() {
  const data = await scrapeLocalRiskNews();

  return {
    ...data,
    total: data.stories.length,
  };
}

module.exports = {
  getLocalNews,
};
