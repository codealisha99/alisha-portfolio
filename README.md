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
| Video | set `data-youtube="VIDEO_ID"` on `#video` |
| Photos | swap the `picsum.photos` URLs for your own images in `assets/` |
| Résumé | the `<dialog id="resume">` doubles as the print/PDF version |

Visitor stickies, the whiteboard drawing and dragged positions are stored in each visitor's own `localStorage`. Nothing is sent anywhere.
