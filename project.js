// Project pages: theme switch, launch video, screenshot lightbox. No framework.
const $ = (s, r = document) => r.querySelector(s);
const root = document.documentElement;

const themeBtn = $("[data-toggle=theme]");
const syncTheme = () => themeBtn?.setAttribute("aria-checked", root.dataset.theme === "dark");
syncTheme();
themeBtn?.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem("desk:theme", JSON.stringify(root.dataset.theme)); } catch { /* storage blocked: theme lasts this page only */ }
  syncTheme();
});

// launch video: nothing downloads until play; browsers without WebM get the live/repo link instead
const tape = $(".pp-tape");
if (tape) {
  const video = $("video", tape), play = $(".play", tape);
  play.addEventListener("click", () => {
    if (!video.canPlayType('video/webm; codecs="vp9"')) {
      $(".fallback", tape).hidden = false;
      play.remove();
      return;
    }
    tape.classList.add("on");
    video.controls = true;
    video.play().catch((e) => { console.warn("launch video failed", e); $(".fallback", tape).hidden = false; });
  });
}

// screenshots open full size in a native dialog (Esc and backdrop click close it)
const box = $("dialog.lightbox");
document.querySelectorAll(".pp-shot button").forEach((b) => b.addEventListener("click", () => {
  const img = $("img", b);
  $("img", box).src = img.dataset.full;
  $("img", box).alt = img.alt;
  $("p", box).textContent = img.alt;
  box.showModal();
}));
box?.addEventListener("click", (e) => { if (e.target === box) box.close(); });
