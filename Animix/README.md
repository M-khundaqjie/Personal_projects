# Animix

A cross-platform mobile app, built with React Native (Expo), that turns your MyAnimeList backlog into a spin-the-wheel decision tool. Animix authenticates against your MyAnimeList account, pulls your *Plan to Watch* and *Plan to Read* lists in real time, and selects a title for you — replacing endless scrolling with a single tap.

---

## Overview

Most "what should I watch" lists grow faster than anyone works through them. Animix reframes the backlog as a decision problem: rather than browse, you spin a wheel built from your own live list and commit to whatever it lands on. The app is fully personalized — every title on the wheel comes from the authenticated user's account, not a generic catalog.

## Features

- **Live data** — connects to MyAnimeList via OAuth2 and reads the user's actual lists.
- **Single-tap selection** — the wheel lands on one title, removing decision paralysis.
- **Flexible scope** — switch between Anime, Manga, or a combined wheel.
- **Configurable wheel** — spin the entire list, a chosen number of random titles, or a hand-picked subset.
- **Adaptive interface** — a cyberpunk-minimal design with dark and light modes.

## Screenshots

<img width="642" height="1389" alt="IMG_9600" src="https://github.com/user-attachments/assets/13574725-dc73-410a-b6b1-cc17b27b553d" />
<img width="642" height="1389" alt="IMG_9599" src="https://github.com/user-attachments/assets/c3cdcf52-9381-481e-9889-9ada218a579c" />
<img width="642" height="1389" alt="IMG_9598" src="https://github.com/user-attachments/assets/9a022d51-539c-4315-afed-fbea80f8bbac" />
<img width="642" height="1389" alt="IMG_9597" src="https://github.com/user-attachments/assets/0e699871-55ab-4e51-b9a0-ae81a0c84278" />
<img width="642" height="1389" alt="IMG_9596" src="https://github.com/user-attachments/assets/8727618b-cf6a-45ad-a2c0-32dbffb75e8d" />


---

## Architecture

Animix separates concerns across three components so that credentials never reach the mobile client:

```
  MyAnimeList API
        │  OAuth2 (PKCE)
        ▼
  Auth step          ──►  token.json    one-time login; stores the access token
        │
        ▼
  animix_server.py   ──►  GET /lists     holds the token, serves lists as JSON,
        │                                refreshes the token on expiry
        ▼
  App.js (Expo)      ──►  fetch /lists    renders the wheel from live data
```

The access token is held by a lightweight backend rather than embedded in the app. The mobile client only ever receives a list of titles, which keeps the client secret off the device.

## Tech stack

| Layer    | Technology                                            |
|----------|-------------------------------------------------------|
| Frontend | React Native (Expo), `react-native-svg`               |
| Backend  | Python — standard-library HTTP server, no frameworks  |
| API      | MyAnimeList API v2, OAuth2 with PKCE                   |

---

## Getting started

### Prerequisites

- Node 20
- Python 3
- A free [MyAnimeList API client](https://myanimelist.net/apps/list)

### Setup

1. **Add credentials.** Copy `config.example.py` to `config.py` and enter your Client ID and Secret.
2. **Authenticate once.** Run the OAuth login step to generate `token.json`.
3. **Start the backend.** `python3 animix_server.py`, then verify at `http://localhost:8000/lists`.
4. **Point the app at the backend.** In `App.js`, set `BACKEND_URL` to your machine's IP (`ipconfig getifaddr en0`).
5. **Run the app.** From the app directory: `npx expo install`, then `npx expo start`. Open in Expo Go on the same network, or press `w` to run in a browser.

> MyAnimeList's OAuth implementation requires the `plain` PKCE method; the auth step handles this automatically.

## Security

`config.py` and `token.json` contain credentials and are excluded from version control via `.gitignore`. Anyone forking the project supplies their own.

## Roadmap

- App Store distribution via a standalone build
- Result history and "re-roll" controls
- Optional filters (genre, score, episode count)

## License

MIT

---

*Built as a portfolio project exploring third-party API integration, OAuth2, and cross-platform mobile development.*
