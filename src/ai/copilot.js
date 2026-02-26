const { getWeatherData, getWeatherAlerts } = require('../data/weather');
const { getCityServiceUpdates } = require('../data/city-services');
const { getSafetyIncidents } = require('../data/safety');

function classifyQuestion(question = '') {
  const q = question.toLowerCase();
  if (/weather|rain|storm|temperature|forecast|heat|wind/.test(q)) return 'weather';
  if (/alert|warning|emergency|danger|extreme/.test(q)) return 'alerts';
  if (/city|service|garbage|trash|announcement|public works|government/.test(q)) return 'city';
  if (/crime|safety|incident|road|outage|flood/.test(q)) return 'safety';
  return 'general';
}

function buildFallbackAnswer(questionType, context) {
  if (questionType === 'weather') {
    const c = context.weather?.current;
    return `Current weather in Montgomery: ${c?.temperature_2m ?? 'N/A'}${context.weather?.current_units?.temperature_2m ?? ''}, wind ${c?.wind_speed_10m ?? 'N/A'} ${context.weather?.current_units?.wind_speed_10m ?? ''}.`;
  }

  if (questionType === 'alerts') {
    const alerts = context.alerts?.alerts || [];
    if (!alerts.length) return 'No major weather risk alerts are detected in the 7-day forecast right now.';
    return `Active forecast-based alerts: ${alerts.slice(0, 3).map((a) => `${a.type} on ${a.date}`).join('; ')}.`;
  }

  if (questionType === 'city') {
    const items = context.city?.announcements || [];
    if (!items.length) return 'I could not load city announcements right now, but I can try again shortly.';
    return `Latest city updates include: ${items.slice(0, 3).map((a) => a.title).join(' | ')}.`;
  }

  if (questionType === 'safety') {
    const incidents = context.safety?.incidents || [];
    return `Recent public safety notes: ${incidents.slice(0, 3).map((i) => `${i.type} (${i.severity}) at ${i.location}`).join('; ')}.`;
  }

  return 'I can help with Montgomery weather, alerts, city services, and public safety updates. Ask me a specific risk-related question.';
}

async function callGemini(question, questionType, context) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const prompt = `You are Civic Risk Copilot for Montgomery, Alabama.\nUser question: ${question}\nQuestion type: ${questionType}\nData context (JSON): ${JSON.stringify(context).slice(0, 12000)}\n\nRespond in clear, practical language for residents. Include safety-first suggestions when relevant.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n')?.trim();
  return text || null;
}

async function askCopilot(question) {
  const questionType = classifyQuestion(question);

  const [weather, alerts, city, safety] = await Promise.all([
    getWeatherData().catch(() => null),
    getWeatherAlerts().catch(() => null),
    getCityServiceUpdates().catch(() => null),
    Promise.resolve(getSafetyIncidents()),
  ]);

  const context = { weather, alerts, city, safety };

  try {
    const answer = await callGemini(question, questionType, context);
    if (answer) return { answer, questionType, context };
  } catch (error) {
    // fall through to local answer
  }

  return {
    answer: buildFallbackAnswer(questionType, context),
    questionType,
    context,
    fallback: true,
  };
}

module.exports = {
  askCopilot,
  classifyQuestion,
};
