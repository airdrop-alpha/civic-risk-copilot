# Civic Risk Copilot

Civic Risk Copilot is a real-time civic intelligence dashboard + AI assistant for **Montgomery, Alabama**.
It fuses weather, official alerts, flood gauges, air quality, earthquakes, safety incidents, city notices, and local news into one risk view with an explainable score.

## Why this project
Residents usually need to monitor many disconnected sources during severe weather, heat stress, flooding, or city disruptions.
This app centralizes those signals and translates them into practical, city-level risk guidance.

---

## ✨ Key Features

- **Live multi-hazard dashboard** (weather, alerts, AQI, flood, earthquakes, incidents, city services, news)
- **Explainable risk engine** with weighted factor breakdown
- **Overall 0-100 score + severity level** (`low`, `moderate`, `high`, `severe`)
- **AI copilot chat** grounded by current dashboard context
- **Graceful degradation** when one data source is down
- **5-min in-memory cache** for API stability/performance

---

## 🧠 Risk Scoring Methodology

The risk engine calculates factor scores (0-100), then applies weights:

- Official alerts: **24%**
- Flood risk: **22%**
- Heatwave risk: **20%**
- Air quality risk: **16%**
- Earthquake activity: **10%**
- Community incidents: **8%**

### Severity mapping

- `0-24` → **Low**
- `25-49` → **Moderate**
- `50-74` → **High**
- `75-100` → **Severe**

The UI shows each factor score, weighted contribution, and textual summary for transparency.

---

## 🏗️ Architecture

```text
[Browser Dashboard + AI Copilot]
              |
              v
         [Express API]
              |
              +--> /api/dashboard (aggregated + risk scoring)
              +--> /api/chat (Gemini with civic context)
              +--> /api/weather /api/alerts /api/air-quality
              +--> /api/flood /api/earthquakes /api/incidents
              +--> /api/news /api/city-services /api/health
              |
              v
      [In-memory Cache, 5 min TTL]
              |
              v
      [Data Source Adapters]
```

---

## 🔌 Data Sources

- Open-Meteo Forecast API
- Open-Meteo Air Quality API
- NOAA / NWS Alerts API (`api.weather.gov`)
- USGS Water Services API (`waterservices.usgs.gov`)
- USGS Earthquake API (`earthquake.usgs.gov`)
- Montgomery Open Data (Socrata)
- Montgomery city site updates
- Montgomery Advertiser + WSFA local news feeds/scrape paths

---

## 🚀 Quick Start

### 1) Install

```bash
npm install
```

### 2) Configure environment

Create `.env`:

```bash
GEMINI_API_KEY=your_gemini_key
# optional
BRIGHT_DATA_API_KEY=your_brightdata_key
PORT=3000
```

### 3) Run

```bash
npm start
```

Open: `http://localhost:3000`

### 4) Health check

```bash
curl http://localhost:3000/api/health
```

---

## API Endpoints

- `GET /api/dashboard`
- `GET /api/weather`
- `GET /api/alerts`
- `GET /api/air-quality`
- `GET /api/flood`
- `GET /api/earthquakes`
- `GET /api/incidents`
- `GET /api/news`
- `GET /api/city-services`
- `GET /api/health`
- `POST /api/chat` with `{ "message": "..." }`

---

## Demo Screenshots

> Hackathon note: real screenshots should be refreshed before final submission demo.

- Dashboard overview: `docs/screenshots/dashboard-overview.svg`
- AI copilot panel: `docs/screenshots/chat-copilot.svg`

---

## Tech Stack

- Node.js + Express
- Axios
- Gemini API
- Vanilla HTML/CSS/JS frontend

---

## Hackathon

**World Wide Vibes Hackathon** (deadline: 2026-03-09)

Built by Alpha (AI Agent) & Ted
