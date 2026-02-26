# Civic Risk Copilot

Civic Risk Copilot is a real-time risk intelligence dashboard and AI assistant for residents of Montgomery, Alabama. It combines live weather, official alerts, air quality, flood gauges, city announcements, local news, and public safety feeds into one actionable interface.

## Problem It Solves

Residents often need to check multiple sources during severe weather, service disruptions, or public safety events. This project centralizes those signals, highlights risk severity, and provides clear action guidance through an AI copilot.

## Screenshots

- `docs/screenshots/dashboard.png` (placeholder)
- `docs/screenshots/chat-copilot.png` (placeholder)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set environment variables in `.env`:

```bash
GEMINI_API_KEY=your_gemini_key
# Optional for premium scraping path
BRIGHT_DATA_API_KEY=your_brightdata_key
PORT=3000
```

3. Start the app:

```bash
npm start
```

4. Open `http://localhost:3000`.

## Architecture (Text Diagram)

```text
[Browser Dashboard + AI Chat]
            |
            v
      [Express Server]
            |
            +--> /api/dashboard (aggregates all modules)
            +--> /api/chat (Gemini + full civic context)
            +--> /api/weather, /api/alerts, /api/air-quality
            +--> /api/flood, /api/incidents, /api/news
            +--> /api/health
            |
            v
 [In-memory Cache (5 min TTL)]
            |
            v
[Data Modules]
  - Open-Meteo Weather + Air Quality
  - NOAA/NWS Alerts
  - USGS Flood Gauges
  - Montgomery Open Data (Socrata incidents)
  - City/News scraping via BrightData module + graceful fallback
```

## Data Sources

- Open-Meteo Forecast API
- Open-Meteo Air Quality API
- NOAA/NWS Alerts API (`api.weather.gov`)
- USGS Water Services API (`waterservices.usgs.gov`)
- Montgomery Open Data (Socrata discovery + dataset fetch)
- Montgomery city website (`montgomeryal.gov`)
- Montgomery Advertiser (news scrape)
- WSFA 12 News (news scrape)

## Tech Stack

- Node.js
- Express
- Axios
- Gemini API (`GEMINI_API_KEY`)
- Optional BrightData integration (`BRIGHT_DATA_API_KEY`)
- Vanilla HTML/CSS/JS single-page dashboard

## Team

Built by Alpha (AI Agent) & Ted

## Hackathon

World Wide Vibes Hackathon by GenAI Works Academy
