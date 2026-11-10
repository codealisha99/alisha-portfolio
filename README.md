<img src="assets/icon.svg" width="64" height="64" alt="">

# alisha's board

Alisha Karma's portfolio, laid out like an IKEA SKÅDIS-style pegboard with paper things clipped to it. Visitors can drag the board, move things around, draw on the whiteboard and leave sticky notes. Plain HTML/CSS/JS, no build step.

```sh
python3 -m http.server 4173   # then open http://localhost:4173
```

## Editing

All copy lives in `index.html`. Each object on the board has its position inline: `style="--x:…;--y:…;--r:…"`.

| Thing | Where to change it |
|---|---|
| Projects | the six `.repo` cards in `#projects` (hand-picked from github.com/codealisha99) |
| Real voice notes | set `data-src="assets/hello.mp3"` on a `.cassette` (with no file, the note is read aloud by the browser) |
| Demo tape (TV) | `assets/orbit-ledger-demo.webm`, a screen recording of the live site; browsers without WebM get a link to the live site |
| Live demos | `#photos`: screenshots in `assets/shots/` of the deployed projects, each linking to its live URL. Re-capture when a site changes. |
| Résumé | the `<dialog id="resume">` doubles as the print/PDF version |
| Coder mode | the `<main class="coder">` block in `index.html`, styled by `coder.css` (the `</> coder` switch in the top bar) |
| Contribution graph | fetched live for `USER` in `board.js` from github-contributions-api.jogruber.de; fills every `[data-contrib]` |

Type: Gloock (display), Bricolage Grotesque (body), Shantell Sans (handwriting), JetBrains Mono (labels, data, code). Motion uses `--ease-out` and `--dur*` in `styles.css`, and is off under `prefers-reduced-motion`.

## Project pages

Each featured project has its own page at `/projects/<slug>/` with a launch video, screens and notes, plus an index at `/projects/`.

- Copy lives in `scripts/build-projects.mjs` (taken from each project's README).
- Media lives in `assets/projects/<slug>/` with a `media.json` (video file and caption, screenshots with alt text, optional caveat note).
- After editing either, run `node scripts/build-projects.mjs` and commit the generated `projects/` folder. There's no build step on deploy.
- The build refuses to write a page that is missing its video, has fewer than 2 screenshots, or has a screenshot without real alt text.
- All footage is recorded from the real running apps: the live sites, or a local run for zentro, sherlock and gossipsub. Re-record when a product changes.

Visitor stickies, the whiteboard drawing and dragged positions are stored in each visitor's own `localStorage`. Nothing is sent anywhere.
