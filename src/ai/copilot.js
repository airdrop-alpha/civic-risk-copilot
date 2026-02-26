function classifyQuestion(question = '') {
  const q = question.toLowerCase();
  if (/weather|rain|storm|temperature|forecast|heat|wind/.test(q)) return 'weather';
  if (/alert|warning|emergency|danger|extreme|watch/.test(q)) return 'alerts';
  if (/city|service|garbage|trash|announcement|public works|government|closure/.test(q)) return 'city';
  if (/crime|safety|incident|road|outage|police/.test(q)) return 'safety';
  if (/flood|river|gauge|water level|usgs/.test(q)) return 'flood';
  if (/air|aqi|ozone|pollution|smoke/.test(q)) return 'air';
  return 'general';
}

function buildFallbackAnswer(questionType, context) {
  if (!context) {
    return 'I could not load dashboard data right now. Please retry in a moment.';
  }

  const risk = context.overallRisk || 'unknown';

  if (questionType === 'weather') {
    const c = context.weather?.current || {};
    return `Current weather is ${c.temperature_2m ?? 'N/A'}${context.weather?.current_units?.temperature_2m || ''} with ${c.weather_description || 'unknown conditions'}. Action: monitor wind/rain updates before travel.`;
  }

  if (questionType === 'alerts') {
    const alerts = context.alerts?.alerts || [];
    if (!alerts.length) return 'No active alerts are currently listed. Action: still check city updates before major outdoor plans.';
    return `There are ${alerts.length} active risk alerts. Top event: ${alerts[0].event || alerts[0].type || 'General advisory'}. Action: review warnings and avoid affected areas.`;
  }

  if (questionType === 'city') {
    const items = context.cityServices?.announcements || [];
    return items.length
      ? `City announcements include: ${items.slice(0, 2).map((a) => a.title).join(' | ')}. Action: verify service schedules or closures before heading out.`
      : 'No city announcements were captured right now. Action: check montgomeryal.gov directly for official service updates.';
  }

  if (questionType === 'safety') {
    const incidents = context.incidents?.incidents || [];
    return incidents.length
      ? `Recent incidents: ${incidents.slice(0, 3).map((i) => `${i.type} (${i.severity})`).join('; ')}. Action: stay alert in high-activity zones and use well-lit routes.`
      : 'Incident feed returned no records at the moment. Action: continue monitoring local police channels.';
  }

  if (questionType === 'flood') {
    const highestRisk = context.flood?.highestRisk || 'unknown';
    return `Flood monitoring risk is ${highestRisk}. Action: avoid low-lying roads during heavy rain and monitor USGS gauge changes.`;
  }

  if (questionType === 'air') {
    const aqi = context.airQuality?.current?.us_aqi;
    const label = context.airQuality?.classification?.label || 'Unknown';
    return `Current AQI is ${aqi ?? 'N/A'} (${label}). Action: sensitive groups should limit prolonged outdoor exertion when AQI rises.`;
  }

  return `Overall civic risk is ${risk}. Action: review alerts, flood gauges, and city announcements before making travel or outdoor decisions.`;
}

async function callGemini(question, questionType, context) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const prompt = [
    'You are Civic Risk Copilot for Montgomery, Alabama.',
    'Use ONLY the provided data context.',
    'Be practical and specific for residents.',
    'Always include: (1) a direct answer, (2) 2-4 actionable steps, (3) Data Sources line citing relevant feeds.',
    `Question type: ${questionType}`,
    `User question: ${question}`,
    `Context JSON: ${JSON.stringify(context).slice(0, 25000)}`,
  ].join('\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
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

async function askCopilot(question, context) {
  const questionType = classifyQuestion(question);

  try {
    const answer = await callGemini(question, questionType, context);
    if (answer) {
      return {
        answer,
        questionType,
        sources: context?.sources || [],
        fallback: false,
      };
    }
  } catch (error) {
    // ignore and use deterministic fallback answer
  }

  return {
    answer: buildFallbackAnswer(questionType, context),
    questionType,
    sources: context?.sources || [],
    fallback: true,
  };
}

module.exports = {
  askCopilot,
  classifyQuestion,
};
