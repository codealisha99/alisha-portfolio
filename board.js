// Alisha's pegboard. No framework: pan/zoom the board, drag things, draw, stick notes, play tapes.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn("couldn't save", k, e); } },
};
const vp = $(".viewport"), board = $(".board");
const desk = matchMedia("(min-width: 821px)");
const root = document.documentElement;
const coder = () => root.dataset.mode === "coder";
const INTERACTIVE = "a, button, input, textarea, label, select, canvas, iframe, dialog";

/* ---------- view (pan + zoom) ---------- */
const view = { x: 0, y: 0, s: 1 };
const apply = () => { board.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`; };
const clampS = (s) => Math.min(1.6, Math.max(0.28, s));

function zoomAt(factor, cx = innerWidth / 2, cy = innerHeight / 2) {
  const s = clampS(view.s * factor), k = s / view.s;
  view.x = cx - (cx - view.x) * k;
  view.y = cy - (cy - view.y) * k;
  view.s = s;
  apply();
}
function centerOn(el, glide = true, s = view.s) {
  view.s = s;
  view.x = innerWidth / 2 - (el.offsetLeft + el.offsetWidth / 2) * s;
  view.y = (innerHeight + 60) / 2 - (el.offsetTop + el.offsetHeight / 2) * s;
  board.classList.toggle("glide", glide);
  apply();
}
function fit() {
  const s = clampS(Math.min(innerWidth / board.offsetWidth, (innerHeight - 80) / board.offsetHeight) * 0.96);
  view.s = s;
  view.x = (innerWidth - board.offsetWidth * s) / 2;
  view.y = 70 + (innerHeight - 70 - board.offsetHeight * s) / 2;
  board.classList.add("glide");
  apply();
}
const stopGlide = () => board.classList.remove("glide");

/* ---------- positions (dragged items remember where you left them) ---------- */
const POS = "desk:pos";
let positions = store.get(POS, {});
let z = 10;
function place(el) {
  const p = positions[el.id];
  if (p) { el.style.setProperty("--x", p.x + "px"); el.style.setProperty("--y", p.y + "px"); }
}

/* ---------- pointer: pan the mat or drag an item ---------- */
let drag = null;
vp.addEventListener("pointerdown", (e) => {
  if (!desk.matches || e.button !== 0) return;
  if (e.target.closest(INTERACTIVE)) return;
  stopGlide();
  const item = e.target.closest(".item");
  drag = item
    ? { item, sx: e.clientX, sy: e.clientY, ox: parseFloat(getComputedStyle(item).getPropertyValue("--x")), oy: parseFloat(getComputedStyle(item).getPropertyValue("--y")) }
    : { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
  if (item) { item.classList.add("dragging"); item.style.zIndex = ++z; }
  else vp.classList.add("panning");
  vp.setPointerCapture(e.pointerId);
});
vp.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (drag.item) {
    drag.item.style.setProperty("--x", drag.ox + dx / view.s + "px");
    drag.item.style.setProperty("--y", drag.oy + dy / view.s + "px");
  } else {
    view.x = drag.ox + dx; view.y = drag.oy + dy; apply();
  }
});
function endDrag() {
  if (!drag) return;
  const { item } = drag;
  if (item?.id) {
    item.classList.remove("dragging");
    const cs = getComputedStyle(item);
    positions = { ...positions, [item.id]: { x: parseFloat(cs.getPropertyValue("--x")), y: parseFloat(cs.getPropertyValue("--y")) } };
    store.set(POS, positions);
  }
  vp.classList.remove("panning");
  drag = null;
}
vp.addEventListener("pointerup", endDrag);
vp.addEventListener("pointercancel", endDrag);

vp.addEventListener("wheel", (e) => {
  if (!desk.matches) return;
  e.preventDefault();
  stopGlide();
  if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
  else { view.x -= e.deltaX; view.y -= e.deltaY; apply(); }
}, { passive: false });

addEventListener("keydown", (e) => {
  if (!desk.matches || coder() || e.target.closest("input, textarea, dialog")) return;
  const step = 120, moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
  if (moves[e.key]) { e.preventDefault(); board.classList.add("glide"); view.x += moves[e.key][0]; view.y += moves[e.key][1]; apply(); }
  if (e.key === "+" || e.key === "=") zoomAt(1.2);
  if (e.key === "-") zoomAt(1 / 1.2);
});

// keyboard users tabbing onto something off-screen get carried to it
board.addEventListener("focusin", (e) => {
  if (!desk.matches) return;
  const item = e.target.closest(".item");
  if (!item) return;
  const r = item.getBoundingClientRect();
  if (r.left < 0 || r.top < 70 || r.right > innerWidth || r.bottom > innerHeight) centerOn(item);
});
vp.addEventListener("scroll", () => { vp.scrollLeft = vp.scrollTop = 0; }); // focus can scroll overflow:hidden; undo it

/* ---------- top bar ---------- */
$$(".tabs a, .ruler a, .logo").forEach((a) => a.addEventListener("click", (e) => {
  if (coder()) { e.preventDefault(); scrollTo({ top: 0, behavior: "smooth" }); return; }
  if (!desk.matches) return; // mobile: normal anchor scroll
  const el = $(a.getAttribute("href"));
  if (!el) return;
  e.preventDefault();
  centerOn(el, true, Math.max(view.s, 0.8));
  $$(".tabs a").forEach((t) => t.classList.toggle("on", t === a));
}));
$$("[data-zoom]").forEach((b) => b.addEventListener("click", () => {
  const d = +b.dataset.zoom;
  if (!d) return fit();
  board.classList.add("glide");
  zoomAt(d > 0 ? 1.25 : 0.8);
}));
$("[data-tidy]").addEventListener("click", () => {
  positions = {};
  store.set(POS, positions);
  $$(".item[id]").forEach((el) => {
    const home = el.dataset.home;
    if (home) { const [x, y] = home.split(","); el.style.setProperty("--x", x); el.style.setProperty("--y", y); }
  });
});

/* ---------- switches: light/dark theme, desk/coder mode (initial values set in <head>) ---------- */
const SWITCHES = { theme: ["light", "dark"], mode: ["desk", "coder"] };
$$("[data-toggle]").forEach((b) => {
  const key = b.dataset.toggle, [off, on] = SWITCHES[key];
  const sync = () => b.setAttribute("aria-checked", root.dataset[key] === on);
  sync();
  b.addEventListener("click", () => {
    root.dataset[key] = root.dataset[key] === on ? off : on;
    store.set("desk:" + key, root.dataset[key]);
    sync();
    if (key === "mode") { scrollTo(0, 0); if (!coder()) start(); } // board was display:none, re-centre it
  });
});

/* ---------- github contribution graph (fills every [data-contrib]) ---------- */
(() => {
  const USER = "codealisha99";
  const boxes = $$("[data-contrib]");
  const cell = (cls, title) => { const i = document.createElement("i"); i.className = cls; if (title) i.title = title; return i; };
  const fail = () => boxes.forEach((b) => {
    const p = document.createElement("p"); p.className = "contrib-msg";
    p.innerHTML = `couldn’t load the graph — <a href="https://github.com/${USER}" target="_blank" rel="noopener">see it on GitHub →</a>`;
    b.replaceChildren(p);
  });
  fetch(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
    .then(({ contributions: days }) => {
      if (!Array.isArray(days) || !days.length) throw new Error("unexpected response shape");
      const total = days.reduce((n, d) => n + (Number(d.count) || 0), 0);
      const lead = new Date(days[0].date + "T00:00").getDay(); // grid rows are Sun..Sat
      boxes.forEach((b) => {
        const grid = document.createElement("div");
        grid.className = "contrib-grid";
        grid.append(
          ...Array.from({ length: lead }, () => cell("pad")),
          ...days.map((d) => cell("l" + Math.min(4, Math.max(0, d.level | 0)), `${d.count} contribution${d.count === 1 ? "" : "s"} on ${d.date}`)),
        );
        const foot = document.createElement("p");
        foot.className = "contrib-foot";
        const sum = document.createElement("a");
        sum.href = `https://github.com/${USER}`; sum.target = "_blank"; sum.rel = "noopener";
        sum.textContent = `${total.toLocaleString()} contributions in the last year`;
        const key = document.createElement("span");
        key.className = "contrib-key";
        key.append("less", ...[0, 1, 2, 3, 4].map((l) => cell("l" + l)), "more");
        foot.append(sum, key);
        b.replaceChildren(grid, foot);
        b.scrollLeft = b.scrollWidth; // narrow screens: show the most recent weeks first
      });
    })
    .catch((e) => { console.warn("contribution graph failed", e); fail(); });
})();

/* ---------- visitor stickies ---------- */
const NOTES = "desk:notes";
let notes = store.get(NOTES, []);
const COLORS = ["lime", "pink", "lilac", "peach"];

function renderNote(n) {
  const el = document.createElement("div");
  el.className = `item sticky ${COLORS.includes(n.color) ? n.color : "lime"}`;
  el.id = n.id;
  el.style.cssText = `--x:${n.x}px;--y:${n.y}px;--r:${n.r}deg`;
  el.dataset.home = `${n.x}px,${n.y}px`;
  el.textContent = n.text; // textContent: visitor text is never parsed as HTML
  const meta = document.createElement("small");
  meta.textContent = "— you, " + new Date(n.t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const del = document.createElement("button");
  del.className = "del"; del.type = "button"; del.textContent = "×"; del.setAttribute("aria-label", "Remove this note");
  del.addEventListener("click", () => {
    notes = notes.filter((m) => m.id !== n.id);
    store.set(NOTES, notes);
    el.remove();
  });
  el.append(meta, del);
  const pin = document.createElement("span"); pin.className = "pin"; el.prepend(pin);
  place(el);
  $("#notepad").after(el);
  return el;
}

$("#notepad").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const text = form.querySelector("textarea").value.trim().slice(0, 140);
  if (!text) return;
  const n = {
    id: "note-" + Date.now().toString(36),
    text,
    color: new FormData(form).get("c"),
    // new notes pile onto my sticky cluster, never over the receipt
    x: 260 + (notes.length % 4) * 70,
    y: 250 + (notes.length % 3) * 60,
    r: +(Math.random() * 8 - 4).toFixed(1),
    t: Date.now(),
  };
  notes = [...notes, n];
  store.set(NOTES, notes);
  const el = renderNote(n);
  el.style.zIndex = ++z;
  form.reset();
  if (desk.matches) centerOn(el);
});

/* ---------- whiteboard ---------- */
(() => {
  const wb = $("#whiteboard"), cv = $("canvas", wb), ctx = cv.getContext("2d");
  const KEY = "desk:wb";
  let color = "#1d1b2f", erasing = false, last = null;
  ctx.lineCap = ctx.lineJoin = "round";

  const saved = localStorage.getItem(KEY);
  if (saved) {
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0); wb.classList.add("drawn"); };
    img.src = saved;
  }
  // board can be scaled/rotated; map client coords back to canvas pixels
  const pt = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) };
  };
  cv.addEventListener("pointerdown", (e) => {
    cv.setPointerCapture(e.pointerId);
    last = pt(e);
    wb.classList.add("drawn");
  });
  cv.addEventListener("pointermove", (e) => {
    if (!last) return;
    const p = pt(e);
    ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = erasing ? 40 : 6 + Math.min(4, (e.pressure || 0.5) * 4);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p;
  });
  const up = () => {
    if (!last) return;
    last = null;
    try { localStorage.setItem(KEY, cv.toDataURL()); } catch (e) { console.warn("whiteboard too big to save", e); }
  };
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", up);

  $$(".marker", wb).forEach((m) => m.addEventListener("click", () => {
    color = m.dataset.color; erasing = false;
    $$(".marker", wb).forEach((o) => o.setAttribute("aria-pressed", o === m));
  }));
  $("[data-erase]", wb).addEventListener("click", () => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    localStorage.removeItem(KEY);
    wb.classList.remove("drawn");
  });
})();

/* ---------- voice notes: real audio if data-src, otherwise read aloud ---------- */
(() => {
  let current = null; // { el, stop }
  const stopCurrent = () => { current?.stop(); current = null; };
  $$(".cassette").forEach((c) => {
    const btn = $("button", c);
    const done = () => { c.classList.remove("playing"); btn.textContent = "▶"; };
    btn.addEventListener("click", () => {
      const wasMe = current?.el === c;
      stopCurrent();
      if (wasMe) return;
      c.classList.add("playing"); btn.textContent = "■";
      if (c.dataset.src) {
        const audio = new Audio(c.dataset.src);
        audio.onended = () => { done(); current = null; };
        audio.play().catch((e) => { console.warn("audio failed", e); done(); });
        current = { el: c, stop: () => { audio.pause(); done(); } };
      } else if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(c.dataset.say);
        u.rate = 0.98; u.pitch = 1.1;
        u.onend = u.onerror = () => { done(); if (current?.el === c) current = null; };
        speechSynthesis.speak(u);
        current = { el: c, stop: () => { speechSynthesis.cancel(); done(); } };
      } else {
        done();
        alert(c.dataset.say);
      }
    });
  });
})();

/* ---------- tv: static until a video is set ---------- */
(() => {
  const tv = $("#video"), cv = $(".screen canvas", tv), ctx = cv.getContext("2d");
  const img = ctx.createImageData(cv.width, cv.height);
  let on = false, timer = 0;
  const frame = () => {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    ctx.putImageData(img, 0, 0);
  };
  frame();
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      clearInterval(timer);
      if (on) timer = setInterval(frame, 70);
    }).observe(cv);
  }
  $(".tv-play", tv).addEventListener("click", () => {
    const id = tv.dataset.youtube;
    const text = $(".screen-text", tv);
    if (!id) { text.innerHTML = "NO SIGNAL<br><span>tape coming soon — come back later</span>"; return; }
    clearInterval(timer);
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`;
    f.allow = "autoplay; encrypted-media; picture-in-picture";
    f.allowFullscreen = true;
    f.title = "Video";
    $(".screen", tv).replaceChildren(f);
  });
})();

/* ---------- dialogs & print ---------- */
$$("[data-open]").forEach((b) => b.addEventListener("click", () => $("#" + b.dataset.open)?.showModal()));
$$("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));
$$("[data-print]").forEach((b) => b.addEventListener("click", () => print()));

/* ---------- boot ---------- */
$$(".item[id]").forEach((el) => {
  el.dataset.home ||= `${el.style.getPropertyValue("--x")},${el.style.getPropertyValue("--y")}`;
  place(el);
});
notes.forEach(renderNote);
function start() {
  if (coder()) return;
  if (!desk.matches) { board.style.transform = ""; return; }
  const target = location.hash && $(location.hash);
  centerOn(target || $("#intro"), false, innerWidth < 1200 ? 0.75 : 0.9);
}
start();
desk.addEventListener("change", start);
setTimeout(() => $(".hint")?.classList.add("gone"), 7000);
