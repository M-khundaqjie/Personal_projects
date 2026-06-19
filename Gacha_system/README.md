# Astra - Gacha Pull Simulator

A web UI for a custom gacha pull system, themed around stars and constellations.
4★ pulls are named stars, 5★ pulls are named constellations. The backend runs
the actual pity/odds logic from [`gacha_engine.py`](gacha_engine.py) (soft pity
from pull 74, 50/50 with guarantee carryover) behind a minimalist black-and-white
star-chart front end.

The actual logic was programmed entirely by me but was based on the logic of Genshin Impact and Honkai Starrail.

## Requirements

- Python 3.9+

## Setup

```bash
git clone <this-repo-url>
cd gacha-ui
pip install -r requirements.txt
```

## Run

```bash
python3 app.py
```

Then open **http://127.0.0.1:5050** in your browser.

## Project structure

```
gacha-ui/
├── app.py            # Flask server and API routes
├── gacha_engine.py   # Pull/pity logic, in-memory state
├── templates/
│   └── index.html    # Page structure
├── static/
│   ├── style.css      # Star-chart / constellation aesthetic
│   └── main.js         # Pull animations, pity gauge, history log
└── requirements.txt
```

## How it works

- **Pity**: chance of a 5★ is 0.6% until pull 74 since the last 5★, then
  ramps up by 6.25 percentage points per pull until it hits 100%.
- **50/50**: a 5★ pull has a 50% chance of being the featured constellation
  (limited) and 50% chance of a standard constellation. Losing the 50/50
  guarantees the featured constellation on the next 5★.
- **4★**: ~10% base chance, guaranteed at least every 10 pulls.

State (pull count, pity, history) is kept in memory on the server and resets
when the server restarts, or via the "reset" button in the UI.
