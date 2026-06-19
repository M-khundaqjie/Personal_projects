// background twinkling star field
(function backgroundSky() {
  const canvas = document.getElementById("bg-stars");
  const ctx = canvas.getContext("2d");
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.floor((canvas.width * canvas.height) / 14000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.1 + 0.4,
      phase: Math.random() * Math.PI * 2,
      speed: 0.004 + Math.random() * 0.006,
    }));
  }

  function drawLinks() {
    ctx.strokeStyle = "rgba(10,10,10,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < stars.length; i++) {
      const a = stars[i];
      for (let j = i + 1; j < stars.length; j++) {
        const b = stars[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 90 && Math.random() < 0.0025) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  let t = 0;
  function frame() {
    t += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLinks();
    for (const s of stars) {
      const flicker = 0.45 + 0.55 * Math.abs(Math.sin(t * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(10,10,10,${0.25 * flicker})`;
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  frame();
})();

// constellation line-art data (simplified, 0-100 viewBox)
const CONSTELLATION_SHAPES = {
  Orion: {
    points: [[20, 8], [50, 6], [80, 12], [33, 46], [50, 44], [67, 46], [28, 88], [72, 88]],
    edges: [[0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [3, 6], [5, 7]],
  },
  "Ursa Major": {
    points: [[8, 72], [24, 60], [42, 64], [56, 52], [62, 32], [78, 22], [90, 12]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
  },
  Cassiopeia: {
    points: [[8, 30], [30, 62], [50, 28], [70, 62], [92, 28]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  Andromeda: {
    points: [[12, 18], [34, 42], [56, 30], [76, 52], [92, 34]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  Cygnus: {
    points: [[50, 6], [50, 94], [12, 54], [88, 54], [50, 40]],
    edges: [[0, 4], [4, 1], [2, 4], [4, 3]],
  },
};

const STAR_PATH =
  "M50 4 L61 36 L96 36 L67 57 L78 90 L50 70 L22 90 L33 57 L4 36 L39 36 Z";

function buildConstellationSVG(name) {
  const shape = CONSTELLATION_SHAPES[name] || CONSTELLATION_SHAPES.Orion;
  let inner = "";
  shape.edges.forEach(([a, b], i) => {
    const [x1, y1] = shape.points[a];
    const [x2, y2] = shape.points[b];
    inner += `<line class="const-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" pathLength="1" style="animation-delay:${i * 0.12}s"></line>`;
  });
  shape.points.forEach(([x, y], i) => {
    inner += `<circle class="const-dot" cx="${x}" cy="${y}" r="2.2" style="animation-delay:${0.5 + i * 0.08}s"></circle>`;
  });
  return `<svg viewBox="0 0 100 100" width="86" height="86">${inner}</svg>`;
}

function buildStarSVG() {
  return `<svg viewBox="0 0 100 100" width="56" height="56"><path class="star-icon" d="${STAR_PATH}"></path></svg>`;
}

// DOM refs
const pityFillEl = document.getElementById("pity-fill");
const pityDotEl = document.getElementById("pity-dot");
const pityTextEl = document.getElementById("pity-text");
const guaranteeTextEl = document.getElementById("guarantee-text");
const statTotal = document.getElementById("stat-total");
const stat5 = document.getElementById("stat-5");
const stat4 = document.getElementById("stat-4");
const historyList = document.getElementById("history-list");
const historyPanel = document.getElementById("history-panel");
const revealOverlay = document.getElementById("reveal-overlay");
const revealCards = document.getElementById("reveal-cards");
const draw1 = document.getElementById("draw-1");
const draw10 = document.getElementById("draw-10");

function renderState(state) {
  const pct = Math.min(100, (state.pulls_since_5star / 90) * 100);
  pityFillEl.style.width = pct + "%";
  pityDotEl.style.left = pct + "%";
  pityTextEl.textContent = `${state.pulls_since_5star} / 90 since last constellation`;
  guaranteeTextEl.classList.toggle("hidden", !state.guaranteed);

  statTotal.textContent = state.total_pulls;
  stat5.textContent = state.five_star_count;
  stat4.textContent = state.four_star_count;

  renderHistory(state.history);
}

function renderHistory(history) {
  historyList.innerHTML = "";
  history.forEach((entry) => {
    const li = document.createElement("li");
    let mark = "·", name = "&mdash;", tag = "";
    if (entry.rarity === 5) {
      mark = "✶";
      name = entry.name;
      tag = `<span class="hist-tag">${entry.kind}</span>`;
      li.classList.add("hist-5");
    } else if (entry.rarity === 4) {
      mark = "✦";
      name = entry.name;
    } else {
      mark = "·";
      name = "stardust";
    }
    li.innerHTML = `<span class="hist-mark">${mark}</span><span class="hist-name">${name}${tag}</span><span class="hist-num">#${entry.pull_number}</span>`;
    historyList.appendChild(li);
  });
}

function buildCard(entry, index) {
  const card = document.createElement("div");
  card.className = `card r${entry.rarity}`;
  card.style.animationDelay = `${index * 0.15}s`;

  const art = document.createElement("div");
  art.className = "card-art";

  if (entry.rarity === 5) {
    art.innerHTML = buildConstellationSVG(entry.name);
    card.innerHTML = "";
    card.appendChild(art);
    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = entry.name;
    const tag = document.createElement("div");
    tag.className = "card-tag";
    tag.textContent = `constellation · ${entry.kind}`;
    card.appendChild(name);
    card.appendChild(tag);
  } else if (entry.rarity === 4) {
    art.innerHTML = buildStarSVG();
    card.appendChild(art);
    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = entry.name;
    const tag = document.createElement("div");
    tag.className = "card-tag";
    tag.textContent = "named star";
    card.appendChild(name);
    card.appendChild(tag);
  } else {
    const dot = document.createElement("div");
    dot.className = "dust-dot";
    art.appendChild(dot);
    card.appendChild(art);
    const tag = document.createElement("div");
    tag.className = "card-tag";
    tag.textContent = "stardust";
    card.appendChild(tag);
  }

  return card;
}

function showReveal(results) {
  revealCards.innerHTML = "";
  results.forEach((entry, i) => revealCards.appendChild(buildCard(entry, i)));
  revealOverlay.classList.remove("hidden");
}

function hideReveal() {
  revealOverlay.classList.add("hidden");
}

async function doPull(count) {
  draw1.disabled = true;
  draw10.disabled = true;
  try {
    const res = await fetch("/api/pull", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
    const data = await res.json();
    showReveal(data.results);
    renderState(data.state);
  } finally {
    draw1.disabled = false;
    draw10.disabled = false;
  }
}

draw1.addEventListener("click", () => doPull(1));
draw10.addEventListener("click", () => doPull(10));
document.getElementById("reveal-close").addEventListener("click", hideReveal);
document.getElementById("reveal-continue").addEventListener("click", hideReveal);

document.getElementById("history-toggle").addEventListener("click", () => {
  historyPanel.classList.add("open");
});
document.getElementById("history-close").addEventListener("click", () => {
  historyPanel.classList.remove("open");
});

document.getElementById("reset-btn").addEventListener("click", async () => {
  const res = await fetch("/api/reset", { method: "POST" });
  const state = await res.json();
  renderState(state);
});

// initial load
fetch("/api/state")
  .then((r) => r.json())
  .then(renderState);
