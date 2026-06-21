# Animix

**A native iOS app that turns your MyAnimeList backlog into a spin-the-wheel decision tool — so you stop scrolling and start watching.**

Pick something to watch in one tap. Animix authenticates against your MyAnimeList account, pulls your *Plan to Watch* / *Plan to Read* lists live, and spins a wheel to choose for you.

---

## Features

- 🔗 **Live MAL data** — connects to your account via OAuth2 and reads your real lists
- 🎡 **Spin wheel** — lands on a single title; no more decision paralysis
- 🔀 **Anime / Manga / Both** — toggle between lists or combine them
- 🎛️ **Wheel control** — spin everything, a random number of titles, or hand-pick the ones you want
- 🌃 **Cyberpunk-minimal UI** — neon accents, dark / light mode

## Screenshots

<!-- Add 2–3 screenshots here. On your phone: screenshot the wheel + a result + the options panel. -->
`( add screenshots )`

---

## How it works

Animix is three small pieces talking to each other:

```
  MyAnimeList API
        │  OAuth2
        ▼
  animix_connect.py   ──► token.json     (one-time login, saves your access token)
        │
        ▼
  animix_server.py    ──► GET /lists      (holds the token, serves your lists as JSON,
        │                                   refreshes the token when it expires)
        ▼
  App.js (Expo)       ──► fetch /lists     (renders the wheel from your live data)
```

Keeping the token on a small backend — instead of inside the app — means the secret never ships in the mobile client. The app only ever sees a list of titles.

## Tech stack

- **Frontend:** React Native (Expo), `react-native-svg` for the wheel
- **Backend:** Python (standard-library HTTP server, no frameworks)
- **API:** MyAnimeList API v2, OAuth2 with PKCE

---

## Run it yourself

**Prerequisites:** Node 20, Python 3, and a free [MAL API client](https://myanimelist.net/apps/list).

1. **Add your keys.** Copy `config.example.py` to `config.py` and paste in your Client ID and Secret.
2. **Log in once:** `python3 animix_connect.py` → approve in the browser → this creates `token.json`.
3. **Start the backend:** `python3 animix_server.py` → confirm at `http://localhost:8000/lists`.
4. **Set the app's target.** In `app/App.js`, set `BACKEND_URL` to your machine's IP (`ipconfig getifaddr en0`).
5. **Run the app:** from the app folder, `npx expo install` then `npx expo start`. Open in **Expo Go** (phone + computer on the same wifi), or press `w` to run it in the browser.

> **Note:** MAL's OAuth only supports the `plain` PKCE method — the connect script handles this.

## Security

`config.py` and `token.json` are gitignored and never committed. If you fork this, add your own.

---

*Built as a portfolio project exploring third-party API integration, OAuth, and native mobile UI.*
