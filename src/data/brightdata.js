const axios = require('axios');

const BRIGHTDATA_ENDPOINT = 'https://api.brightdata.com/request';

function hasBrightDataKey() {
  return Boolean(process.env.BRIGHT_DATA_API_KEY);
}

async function fetchViaBrightData(url) {
  const key = process.env.BRIGHT_DATA_API_KEY;
  if (!key) {
    return {
      ok: false,
      html: null,
      mode: 'fallback',
      error: 'BRIGHT_DATA_API_KEY not configured',
    };
  }

  const headers = {
    Authorization: `Bearer ${key}`,
    Accept: 'text/html,application/json',
  };

  try {
    const response = await axios.get(BRIGHTDATA_ENDPOINT, {
      headers,
      params: { url },
      timeout: 20000,
    });

    const html = typeof response.data === 'string'
      ? response.data
      : (response.data?.body || response.data?.result || null);

    return {
      ok: Boolean(html),
      html,
      mode: 'brightdata',
      error: html ? null : 'BrightData returned an empty payload',
    };
  } catch (firstError) {
    try {
      const response = await axios.post(
        BRIGHTDATA_ENDPOINT,
        { url, format: 'raw' },
        { headers, timeout: 20000 },
      );

      const html = typeof response.data === 'string'
        ? response.data
        : (response.data?.body || response.data?.result || null);

      return {
        ok: Boolean(html),
        html,
        mode: 'brightdata',
        error: html ? null : 'BrightData POST returned an empty payload',
      };
    } catch (secondError) {
      return {
        ok: false,
        html: null,
        mode: 'fallback',
        error: secondError.message || firstError.message,
      };
    }
  }
}

async function fetchDirect(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'CivicRiskCopilot/1.0 (hackathon project)',
      },
    });

    return {
      ok: true,
      html: typeof data === 'string' ? data : JSON.stringify(data),
      mode: 'direct',
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      html: null,
      mode: 'direct',
      error: error.message,
    };
  }
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripTags(html) {
  return decodeHtmlEntities(String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function extractHeadlines(html, sourceUrl, limit = 8, keywords = []) {
  const content = String(html || '');
  const seen = new Set();
  const items = [];

  const headlineRegex = /<(h1|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi;
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  const candidates = [];
  let match;

  while ((match = headlineRegex.exec(content)) !== null) {
    candidates.push({ text: stripTags(match[2]), url: sourceUrl });
  }

  while ((match = linkRegex.exec(content)) !== null) {
    const text = stripTags(match[2]);
    if (text.length >= 20) {
      candidates.push({ text, url: match[1] });
    }
  }

  for (const c of candidates) {
    if (items.length >= limit) break;
    const title = c.text;
    if (!title || title.length < 15) continue;

    const lower = title.toLowerCase();
    if (seen.has(lower)) continue;

    if (keywords.length > 0 && !keywords.some((k) => lower.includes(k))) {
      continue;
    }

    let absoluteUrl = sourceUrl;
    try {
      absoluteUrl = c.url.startsWith('http') ? c.url : new URL(c.url, sourceUrl).toString();
    } catch (_) {
      absoluteUrl = sourceUrl;
    }

    seen.add(lower);
    items.push({
      title,
      url: absoluteUrl,
      source: sourceUrl,
    });
  }

  return items;
}

async function scrapeCityAnnouncements() {
  const sourceUrl = 'https://www.montgomeryal.gov';
  const attempt = hasBrightDataKey() ? await fetchViaBrightData(sourceUrl) : await fetchDirect(sourceUrl);
  const fallback = attempt.ok ? attempt : await fetchDirect(sourceUrl);

  const mode = attempt.ok ? attempt.mode : fallback.mode;
  const html = attempt.ok ? attempt.html : fallback.html;
  const announcements = extractHeadlines(html, sourceUrl, 10)
    .map((item, index) => ({
      id: `city-${index + 1}`,
      title: item.title,
      link: item.url,
      category: 'city-announcement',
    }));

  return {
    source: sourceUrl,
    mode,
    announcements,
    updatedAt: new Date().toISOString(),
    error: (attempt.error && !attempt.ok) ? attempt.error : null,
  };
}

async function scrapeLocalRiskNews() {
  const targets = [
    { name: 'Montgomery Advertiser', url: 'https://www.montgomeryadvertiser.com' },
    { name: 'WSFA 12 News', url: 'https://www.wsfa.com/news/' },
  ];

  const keywords = ['weather', 'storm', 'flood', 'crime', 'police', 'outage', 'road', 'warning', 'closure'];
  const stories = [];
  const errors = [];

  for (const target of targets) {
    const primary = hasBrightDataKey() ? await fetchViaBrightData(target.url) : await fetchDirect(target.url);
    const secondary = primary.ok ? primary : await fetchDirect(target.url);
    const html = primary.ok ? primary.html : secondary.html;
    const mode = primary.ok ? primary.mode : secondary.mode;

    if (!html) {
      errors.push({ source: target.name, error: primary.error || secondary.error || 'No HTML returned' });
      continue;
    }

    const parsed = extractHeadlines(html, target.url, 8, keywords).map((story, index) => ({
      id: `${target.name.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
      source: target.name,
      title: story.title,
      link: story.url,
      mode,
    }));

    stories.push(...parsed);
  }

  return {
    source: 'BrightData/local news scrape',
    stories: stories.slice(0, 12),
    errors,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  hasBrightDataKey,
  scrapeCityAnnouncements,
  scrapeLocalRiskNews,
};
