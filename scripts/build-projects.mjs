// Generates a static page per project: projects/<slug>/index.html, plus projects/index.html.
// Run: node scripts/build-projects.mjs   (no dependencies; output is committed and served as-is)
// Copy comes from each project's README. Media lives in assets/projects/<slug>/ with a media.json:
//   { "video": { "file": "demo.webm", "poster": "shot-1.jpg", "caption": "..." },
//     "shots": [{ "file": "shot-1.jpg", "alt": "..." }], "note": "optional caveat" }
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GH = "https://github.com/codealisha99/";

const PROJECTS = [
  {
    slug: "orbit-ledger", name: "OrbitLedger", repo: "orbit-ledger", live: "https://orbit-ledger-web.vercel.app",
    tagline: "A crypto paper-trading workspace for BTC, ETH and SOL: real market data, virtual money.",
    what: [
      "OrbitLedger lets you practise trading with virtual USD collateral. Execution quotes are simulated from Binance public trades, so prices move like the real market, but no real assets are ever bought or sold.",
      "Leveraged positions are simulated linear perpetuals with no expiry and a fixed, educational funding rule of 1 basis point every 8 hours. The dashboard reconciles available cash, reserved collateral and signed P&L so every number can be traced.",
    ],
    how: [
      ["Price poller", "streams Binance aggregate trades and publishes simulated quotes."],
      ["Backend", "Express on Bun with Prisma/PostgreSQL, a five-second risk cycle and a durable event outbox."],
      ["WebSocket service", "public market feeds plus private, versioned account events that reconcile after reconnects."],
      ["Frontend", "Next.js 15 and React 19 with lightweight-charts and a single managed real-time transport."],
    ],
    stack: ["TypeScript", "Bun", "Next.js 15", "React 19", "Express", "Prisma", "PostgreSQL", "Redis", "WebSockets"],
    run: "cp .env.example .env\nbun install\ndocker compose up -d   # PostgreSQL + Redis\nbun run prisma generate\nbun run prisma migrate deploy\nbun run dev",
  },
  {
    slug: "zentro", name: "Zentro", repo: "zentro", live: null,
    tagline: "Peer-to-peer video calls in the browser. Share a link; no accounts, no downloads.",
    what: [
      "Zentro connects two people directly. Video and audio travel between the participants over WebRTC, so the media never touches a server.",
      "The only server is a small signaling service that introduces the two browsers and then steps out of the way. It keeps no history.",
    ],
    how: [
      ["Lobby", "you create a room and share its link."],
      ["Signaling", "a Node WebSocket server pairs two clients per room and relays the SDP offer/answer and ICE candidates."],
      ["Call", "once connected, all media flows peer-to-peer, with a video grid, controls, chat and a participant list."],
      ["Transcript (optional)", "local audio recording can be transcribed with Groq's Whisper model."],
    ],
    stack: ["TypeScript", "Next.js", "WebRTC", "WebSockets", "Node", "pnpm + Turborepo"],
    run: "pnpm install\npnpm --filter @webrtc-conf/signaling dev   # signaling on :8080\npnpm --filter @webrtc-conf/web dev",
  },
  {
    slug: "sherlock", name: "Sherlock", repo: "sherlock", live: null,
    tagline: "See where a codebase is weak before you read a line of it.",
    what: [
      "Paste a GitHub repository. Sherlock maps the code into an interactive graph, marks security, quality and dependency findings on that map, and scores the repository out of 100.",
      "For a deeper read, a pipeline of six specialised agents running on a local Ollama model writes a technical briefing that explains the codebase from first principles. That stage keeps source code on your machine.",
    ],
    how: [
      ["Ingest", "clones the repository, indexes it with tree-sitter and scans it. This stage needs no language model."],
      ["Graph", "files, classes and functions become an interactive map, coloured by what was found in them."],
      ["Findings", "security, dependency (via osv.dev), maintainability, quality, secrets and testing issues, with severity and triage filters."],
      ["Agent briefing", "Repository Mapper, Flow Tracer, Component Analyst, Data & Integration Analyst, Gap Analyst and Teacher build the full report on a local model."],
    ],
    stack: ["Python", "tree-sitter", "pydantic", "httpx", "osv.dev", "Ollama", "Vanilla JS"],
    run: "python3 -m venv .venv && source .venv/bin/activate\npip install -r requirements.txt\npython -m app.main --serve          # web UI on :8080\n# optional, for the agent briefing:\nollama pull qwen3-coder:30b-16k && ollama serve",
  },
  {
    slug: "talksense", name: "TalkSense", repo: "talksense", live: "https://web-production-c32cc2.up.railway.app",
    tagline: "Learn anything in 20 minutes, then prove it out loud.",
    what: [
      "Pick a topic and a study time. TalkSense gives you a brief of three to five things you should be able to explain, then times your study session.",
      "When the timer ends, you explain the topic out loud. Your voice is transcribed and graded against a fixed four-part rubric, and you can share a public result page.",
    ],
    how: [
      ["Brief", "3–5 concrete objectives, key terms and places to start."],
      ["Study", "a dial timer for 15, 20 or 30 minutes."],
      ["Explain", "speech is transcribed with OpenAI using your own key, which stays in your browser."],
      ["Grade", "coverage 35%, accuracy 30%, depth 20%, clarity 15%. The total is computed on the server, so shared scores can't be forged."],
    ],
    stack: ["TypeScript", "React", "Vite", "motion", "Hono", "Zod", "Neon Postgres", "OpenAI"],
    run: "npm install\necho \"DATABASE_URL=postgres://…\" > .env\nnpm run dev:api   # API on :3000\nnpm run dev       # app on :5173",
  },
  {
    slug: "ai-inference-layer", name: "Inference", repo: "ai-inference-layer", live: "https://ai-inference-layer.vercel.app",
    tagline: "One model registry and inference API, implemented four times behind a single HTTP contract.",
    what: [
      "Register a model, run inputs against it, read the history back. The same API is implemented in Python, TypeScript, Go and Rust, and all four share one contract and one response envelope.",
      "The web workbench, Inference, includes a playground. Its classification, generation and embedding engines are deterministic reference implementations for integration testing; they don't call a hosted language model. Alisha maintains the project.",
    ],
    how: [
      ["Register", "POST /models with a type: text-generation, text-classification or embedding."],
      ["Infer", "POST /models/{id}/infer runs an input against the model."],
      ["Inspect", "GET /models/{id}/inferences reads the history back, paginated."],
      ["Reference port", "Python/FastAPI adds batching, SSE streaming, Prometheus metrics and API-key auth."],
    ],
    stack: ["Python", "FastAPI", "TypeScript", "Fastify", "Go", "Rust", "axum", "PostgreSQL"],
    run: "cd ai-inference-server-py\nuv sync --extra dev --locked\nuv run ais serve --db ./data/ai.db\n# in another terminal: uv run ais demo",
  },
  {
    slug: "gossipsub", name: "Gossipsub 1.4", repo: "Gossipsub", live: null,
    tagline: "Large-message handling for libp2p's gossip protocol: a specification and a working prototype.",
    what: [
      "Gossipsub is optimised for small messages, but decentralised systems increasingly need to move 5–100 MB payloads such as model updates and state snapshots. Gossipsub 1.4 adds a segmentation layer on top of the existing mesh.",
      "This repository holds an RFC-style specification and a Python prototype, submitted for C4GT's DMP 2026. It stays backward-compatible with Gossipsub 1.1 peers.",
    ],
    how: [
      ["Segment", "the publisher splits a large message into fixed-size chunks (64 KB by default)."],
      ["Envelope", "each chunk travels in a GossipSegment with a shared message ID and a per-chunk SHA-256 checksum."],
      ["Propagate", "segments move independently through the mesh, tolerating reordering and partial loss."],
      ["Reassemble", "receivers buffer, verify and reassemble before delivery, so there's no head-of-line blocking."],
    ],
    stack: ["Python", "libp2p", "Streamlit", "SHA-256", "RFC-style spec"],
    run: "python demo.py                              # 5 MB payload end to end\npython -m unittest tests/test_interop.py -v\nstreamlit run app.py                        # interactive demo",
  },
  {
    slug: "schemaguard", name: "SchemaGuard", repo: "schemaguard", live: "https://schemaguard-theta.vercel.app",
    tagline: "Turn messy LLM output into validated JSON, and see every repair it made.",
    what: [
      "Language models often return almost-JSON: trailing commas, single quotes, missing brackets. SchemaGuard repairs common syntax errors, validates the result against strict schemas, and shows exactly what it changed.",
      "The playground needs no model calls, API keys, signup or database.",
    ],
    how: [
      ["Paste", "drop in raw model output."],
      ["Repair", "common JSON syntax errors are fixed, and each fix is recorded."],
      ["Validate", "the repaired JSON is checked against one of three strict schemas."],
      ["Inspect", "review the repair notes, or use the same pipeline through the API."],
    ],
    stack: ["Python", "FastAPI", "Vanilla HTML/CSS/JS", "JSON Schema", "pytest"],
    run: "python3 -m venv .venv && source .venv/bin/activate\npython -m pip install -r requirements-dev.txt\npython -m app.run   # http://localhost:8006/playground",
  },
  {
    slug: "modellab", name: "ModelLab", repo: "modellab", live: "https://modellab-nine.vercel.app",
    tagline: "A small developer lab for simulated training, ranked memory and resumable token streams.",
    what: [
      "ModelLab is a workbench for the plumbing around models: follow a dataset from training to evaluation, explore how a three-tier memory ranks what it recalls, and break a streaming connection to watch every token come back.",
      "Training is simulated, so it needs no external API keys, database or GPU locally. On 2026-10-12 the README records 153 passing tests at 90.19% coverage.",
    ],
    how: [
      ["Train", "a simulated run takes a dataset from training through evaluation."],
      ["Remember", "ranked three-tier memory shows what gets recalled and why."],
      ["Stream", "token streams can be interrupted and resumed, and replay proves no token is lost."],
      ["Inspect", "everything is also exposed through interactive API docs."],
    ],
    stack: ["Python", "FastAPI", "Vanilla HTML/CSS/JS", "SSE", "pytest"],
    run: "python3 -m venv .venv && source .venv/bin/activate\npython -m pip install -r requirements-dev.txt\nOTEL_SDK_DISABLED=true python -m app.run   # http://localhost:8005/playground",
  },
];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function media(p) {
  const dir = join(ROOT, "assets/projects", p.slug);
  const f = join(dir, "media.json");
  if (!existsSync(f)) throw new Error(`${p.slug}: missing ${f}`);
  const m = JSON.parse(readFileSync(f, "utf8"));
  if (!m.video?.file || !m.video?.caption) throw new Error(`${p.slug}: media.json needs video.file and video.caption`);
  if (!Array.isArray(m.shots) || m.shots.length < 2) throw new Error(`${p.slug}: media.json needs at least 2 shots`);
  for (const file of [m.video.file, m.video.poster, ...m.shots.map((s) => s.file)].filter(Boolean)) {
    if (!existsSync(join(dir, file))) throw new Error(`${p.slug}: missing media file ${file}`);
  }
  for (const s of m.shots) if (!s.alt || s.alt.length < 15) throw new Error(`${p.slug}: ${s.file} needs real alt text`);
  return m;
}

const head = (title, desc, depth) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="icon" href="${depth}assets/icon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Gloock&family=JetBrains+Mono:wght@400..800&family=Shantell+Sans:wght,BNCE,INFM@300..800,-100..100,0..100&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${depth}styles.css">
  <link rel="stylesheet" href="${depth}project.css">
  <script>
    (() => { let t = null; try { t = JSON.parse(localStorage.getItem("desk:theme")); } catch {}
      document.documentElement.dataset.theme = t || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); })();
  </script>
</head>`;

const bar = (depth) => `<header class="pp-bar">
  <a class="logo" href="${depth}">alisha<span>’s board</span></a>
  <nav aria-label="Site">
    <a href="${depth}#projects">← the board</a>
    <a href="${depth}projects/">all projects</a>
  </nav>
  <button type="button" class="switch" role="switch" aria-checked="false" data-toggle="theme"><span class="track" aria-hidden="true"></span>dark</button>
</header>`;

const status = (p) => `<p class="pp-status">${p.live ? '<span class="is-live">● live</span>' : '<span class="is-local">runs locally</span>'}<span>${esc(p.stack[0])}</span><span>github.com/codealisha99/${esc(p.repo)}</span></p>`;

function page(p, i) {
  const m = media(p);
  const a = `../../assets/projects/${p.slug}/`;
  const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length], next = PROJECTS[(i + 1) % PROJECTS.length];
  const fallback = p.live
    ? `Your browser can’t play this recording. <a href="${esc(p.live)}" target="_blank" rel="noopener">Try the live site ↗</a>`
    : `Your browser can’t play this recording. <a href="${GH}${esc(p.repo)}" target="_blank" rel="noopener">See the code on GitHub ↗</a>`;
  return `${head(`${p.name} — Alisha Karma`, p.tagline, "../../")}
<body class="pp">
${bar("../../")}
<main>
<article class="sheet-page" aria-labelledby="pp-title">
  <span class="pin" aria-hidden="true"></span>
  <p class="label-maker pp-tag">~/projects/${esc(p.slug)}</p>
  <div class="pp-head">
    <h1 id="pp-title">${esc(p.name)}</h1>
    <p class="pp-tagline">${esc(p.tagline)}</p>
    <div class="pp-actions">
      ${p.live ? `<a class="btn primary" href="${esc(p.live)}" target="_blank" rel="noopener">Open the live site <span aria-hidden="true">↗</span></a>` : ""}
      <a class="btn" href="${GH}${esc(p.repo)}" target="_blank" rel="noopener">View the code <span aria-hidden="true">↗</span></a>
    </div>
  </div>
  ${status(p)}

  <figure class="pp-tape" aria-label="Launch video">
    <div class="frame">
      <video preload="none" playsinline muted poster="${a}${esc(m.video.poster || m.shots[0].file)}" aria-label="${esc(m.video.caption)}">
        <source src="${a}${esc(m.video.file)}" type='video/webm; codecs="vp9"'>
      </video>
      <button type="button" class="play" aria-label="Play the launch video: ${esc(m.video.caption)}"><span aria-hidden="true">▶</span></button>
    </div>
    <figcaption>${esc(m.video.caption)}</figcaption>
    <p class="fallback" hidden>${fallback}</p>
  </figure>

  <div class="pp-body">
    <div>
      <section class="pp-prose" aria-labelledby="pp-what"><h2 id="pp-what">What it is</h2>${p.what.map((t) => `<p>${esc(t)}</p>`).join("")}</section>
      <section aria-labelledby="pp-how"><h2 id="pp-how">How it works</h2><ol class="pp-steps">${p.how.map(([k, v]) => `<li><span><b>${esc(k)}</b>: ${esc(v)}</span></li>`).join("")}</ol></section>
    </div>
    <aside class="pp-aside">
      <section aria-labelledby="pp-stack"><h2 id="pp-stack">Built with</h2><ul class="pp-stack">${p.stack.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>
      <section class="pp-run" aria-labelledby="pp-run"><h2 id="pp-run">Run it yourself</h2><pre tabindex="0" aria-label="Commands to run ${esc(p.name)}"><code>${esc(p.run)}</code></pre>
        <p class="pp-note">From the project README. ${m.note ? esc(m.note) : ""}</p></section>
    </aside>
  </div>

  <section class="pp-shots" aria-labelledby="pp-shots">
    <h2 id="pp-shots">Screens</h2>
    ${m.shots.map((s) => `<figure class="pp-shot"><button type="button" aria-label="Enlarge: ${esc(s.alt)}"><img src="${a}${esc(s.file)}" data-full="${a}${esc(s.file)}" alt="${esc(s.alt)}" loading="lazy" width="1280" height="800"></button><figcaption>${esc(s.alt)}</figcaption></figure>`).join("\n    ")}
  </section>
</article>
<nav class="pp-more" aria-label="More projects">
  <a href="../${prev.slug}/"><small>← previous</small><b>${esc(prev.name)}</b></a>
  <a href="../${next.slug}/"><small>next →</small><b>${esc(next.name)}</b></a>
</nav>
<p class="pp-foot">© 2026 Alisha Karma · <a href="../../#hi">say hi</a></p>
</main>
<dialog class="lightbox" aria-label="Screenshot"><form method="dialog" class="close"><button aria-label="Close">×</button></form><img alt=""><p></p></dialog>
<script src="../../project.js"></script>
</body>
</html>
`;
}

function index() {
  return `${head("Projects — Alisha Karma", "Everything Alisha Karma has built and shipped, each with its own page, screens and launch video.", "../")}
<body class="pp">
${bar("../")}
<main>
<article class="sheet-page" aria-labelledby="pp-title">
  <span class="pin" aria-hidden="true"></span>
  <p class="label-maker pp-tag">~/projects</p>
  <h1 id="pp-title" class="pp-h1">Projects</h1>
  <p class="pp-tagline">${PROJECTS.length} things I’ve built, ${PROJECTS.filter((p) => p.live).length} of them live right now. Each one has a launch video, screens and notes on how it works.</p>
  <div class="pp-index">
    ${PROJECTS.map((p) => { const m = media(p); return `<a class="pp-card" href="${p.slug}/"><img src="../assets/projects/${p.slug}/${esc(m.shots[0].file)}" alt="" loading="lazy" width="1280" height="800"><b>${esc(p.name)}</b><p>${esc(p.tagline)}</p>${status(p)}</a>`; }).join("\n    ")}
  </div>
</article>
<p class="pp-foot"><a href="../">← back to the board</a> · <a href="https://github.com/codealisha99?tab=repositories" target="_blank" rel="noopener">all 89 repos on GitHub ↗</a></p>
</main>
<script src="../project.js"></script>
</body>
</html>
`;
}

PROJECTS.forEach((p, i) => {
  const out = join(ROOT, "projects", p.slug);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "index.html"), page(p, i));
});
writeFileSync(join(ROOT, "projects", "index.html"), index());
console.log(`built ${PROJECTS.length} project pages + index`);
