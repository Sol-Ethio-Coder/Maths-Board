# Math Board

**Developer: [Sol Ethio Coder](https://sol-ethio-coder.netlify.app)**

A simple whiteboard web app for recording math lessons with OBS Studio. Draw with a mouse on your PC, or with your finger on your phone, and show the board on your PC at the same time.

No build step. No server of your own. It is plain HTML, CSS and JavaScript.

## Features

### Lessons, notes and quizzes (new)

Open **Lessons** in the toolbar (or go to `/lessons.html`).

- A catalogue of all **4 grades, 36 units and 209 lessons** from the course blueprint
- **Study notes** for each lesson: key ideas, symbol tables, worked examples, common mistakes and a short recap
- **Quiz** for each lesson: multiple choice, shuffled options, instant feedback with an explanation, a score, a review of missed questions, and a retry. Press 1–4 to answer
- **Progress** is saved in the learner's browser (best score per lesson; 70% or more counts as passed)
- Search, light and dark theme, and **Print or save as PDF** for the notes
- A link back to the Math Board for practice
- Ready now: **Grade 9, Unit 1 (Further on Sets), all 6 lessons.** All other lessons show “Coming soon” until you add them

#### Add a lesson

1. Open `data/content-g9.js` (or `content-g10.js`, `content-g11.js`, `content-g12.js`).
2. Copy an existing lesson block and change its id to the lesson you are adding. IDs follow the pattern `g9-u2-l01` (grade, unit, lesson). The full list is in `data/catalog.js`.
3. Fill in `objective`, `notes` and `quiz` (at least 4 questions). Note block types: `h` (heading), `p` (paragraph), `def` (`["Term", "meaning"]`), `list`, `table` (first row is the header), `ex` (`{ q, steps, a }`), `warn` and `recap`. Use `**text**` for bold.
4. Check your work: `npm run check` (or `node tools/validate-content.js`). It reports wrong ids, bad answer numbers and missing explanations.
5. Raise the version in `sw.js`, then commit and push.

A quiz question looks like this (`a` is the position of the right option, starting at 0):

```js
{ q: "How many subsets does {a, b, c} have?", o: ["3", "6", "8", "9"], a: 2, why: "2³ = 8." }
```


- Pen, line, circle, box, text and move tools
- Colour code buttons: Given, Key step, Answer, Mistake (keys 1–4)
- Three pen thicknesses
- **Neat writing helpers** (made for finger writing):
  - **Smoothing** (Off, Medium, Strong) removes shaky lines
  - **Hold to straighten:** at the end of a stroke, keep your finger still for half a second. A wobbly line becomes straight (and horizontal or vertical if it is close), and a rough loop becomes a perfect circle. Drag to adjust it before you lift your finger
  - **Pinch to zoom** (two fingers, up to 400%) and move the board with two fingers: write small in the zoomed view and it looks neat and small on the recording. The zoom is only on your device, so the PC board stays full size
  - **Typed text** with a math symbol keyboard (², √, π, ≤, ∈, ∪, ∩, ∅, ∑, ∫ and more). Typing `x^2`, `sqrt`, `pi`, `<=`, `>=`, `!=` or `->` turns into the symbol
  - **Lined or grid background** to keep your writing straight
  - Extra touches (a resting palm or a third finger) are ignored
- **Eraser button clears the whole board.** Undo (Ctrl+Z) brings it back
- One-click Venn circles, number line and x–y axes
- Grid on/off, dark or light board (your choice is remembered)
- Save the board as a PNG image
- **Phone to PC sync**: open the same room on two devices and both boards stay the same
- Hide toolbar (key H) for a clean recording
- Works on any screen size (the board is always 16:9), with mouse, touch and pen
- Installable app (PWA), works offline for drawing
- Developer credit with logo in the toolbar (it disappears when you hide the toolbar, so it never appears in your recordings)
- Favicon, app icons (including a maskable icon) and a social preview image (`og-image.png`)
- Keeps the screen awake while it is open (where the browser supports it)

## Keyboard shortcuts

| Key | Action |
|---|---|
| 1 2 3 4 | Colours: Given, Key step, Answer, Mistake |
| P L C B X M | Pen, Line, Circle, Box, Text, Move |
| + − 0 | Zoom in, zoom out, fit |
| E | Eraser (clear all) |
| Ctrl+Z | Undo |
| G | Change background (grid, lines, plain) |
| H | Hide or show toolbar |

## Run on your computer

```bash
cd math-board
npx serve .
```

Open http://localhost:3000 (lessons: http://localhost:3000/lessons.html). (Any static server works. Do not open `index.html` by double-clicking, because the app and service worker need to be served over http.)

## Push to GitHub

1. Create an **empty** repository on github.com named `math-board` (no README, no .gitignore).
2. In the project folder run:

```bash
git init
git add .
git commit -m "Math Board: first version"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/math-board.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

## Deploy to Vercel

**Option A: dashboard (easiest)**

1. Go to vercel.com and sign in with GitHub.
2. Click **Add New → Project** and import the `math-board` repository.
3. Framework Preset: **Other**. Leave Build Command and Output Directory empty. Click **Deploy**.
4. Open the URL Vercel gives you (for example `https://math-board.vercel.app`).

**Option B: command line**

```bash
npm i -g vercel
vercel login
vercel --prod
```

Every `git push` to `main` deploys again automatically (when you use Option A).

## Use it with OBS Studio

1. On your PC open the Math Board site. Press F11 for full screen, then press **H** to hide the toolbar.
2. In OBS add a **Window Capture** (or Display Capture) of that browser window. Use it in your Teach scene.
3. Draw with the mouse, or use your phone (below).

## Tips for neat finger writing

1. Set **Smooth** to Medium or Strong (More menu).
2. Pinch to zoom to 200–300% and write in the zoomed view. Then tap **Fit** to see the whole board.
3. Use **Thick** pen and the lined background.
4. For formulas, use the **Text** tool: tap where it goes, type, and press Enter.
5. Draw lines, circles and boxes by holding still at the end of the stroke, or use the Line, Circle and Box tools.

## Draw on your phone and see it on your PC

1. Open Math Board on the **PC** first. The toolbar shows a room code, for example `Room K7M2P`.
2. Click **Copy link** and send the link to your phone (Telegram saved messages, email, etc.). The link looks like `https://your-site.vercel.app/?room=K7M2P`.
3. Open the link on the phone and turn it sideways. The status line shows that devices are connected.
4. Write on the phone with your finger. It appears on the PC board. You can also draw on the PC.
5. If the two boards ever look different, press **Sync now** on the device that has the correct board.

You can also use **Join** and type the room code instead of opening the link.

### How sync works, and its limits

- Sync is device to device (WebRTC, using the free PeerJS signalling service). The strokes do not pass through any server of yours.
- It needs internet on both devices. On some mobile networks or strict Wi-Fi, a direct connection cannot be made. Then try both devices on the same Wi-Fi.
- If you need a more dependable connection, add a TURN server to `js/sync.js` (see the PeerJS docs, `config.iceServers`) or replace sync with a hosted real-time service.
- Drawing on a single device always works, with or without sync.

## Project structure

```
math-board/
├── index.html              page
├── css/style.css           styles
├── js/app.js               whiteboard logic
├── js/sync.js              phone/PC sync (PeerJS)
├── lessons.html            lessons, notes and quizzes page
├── css/lessons.css         styles for the lessons page
├── js/lessons.js           catalogue, notes viewer, quiz engine, progress
├── data/catalog.js         all grades, units and lessons
├── data/content-g9.js      Grade 9 notes and quizzes (Unit 1 ready); g10, g11, g12 are empty, ready to fill
├── tools/validate-content.js  checks lesson content (npm run check)
├── serve.json              local server settings
├── vendor/peerjs.min.js    PeerJS 1.5.4 (MIT licence)
├── sw.js                   service worker (offline, fast loading)
├── manifest.webmanifest    installable app settings
├── favicon.svg / .ico / -16 / -32   favicons
├── og-image.png            social preview image (1200×630)
├── LICENSE                 MIT licence
├── icons/                  logo.svg, dev-logo.svg and app icons
├── vercel.json             Vercel settings and headers
├── package.json            project info and dev script
└── README.md
```

## Change things

- Colours: edit `PAL` and `NM` at the top of `js/app.js`.
- Pen sizes: edit `WS`.
- After you change any file, raise the version in `sw.js` (`math-board-v6` to `math-board-v7`) so devices load the new files.

## Logos and branding

- `icons/logo.svg` is the Math Board logo. `icons/dev-logo.svg` is the Sol Ethio Coder mark shown in the credit.
- To use your own logo, replace those two SVG files and the PNG files in `icons/` and the favicons in the project root (same file names and sizes), then raise the version in `sw.js`.
- The social preview uses a relative path (`/og-image.png`). After deploying, change `og:image` in `index.html` to the full address, for example `https://your-site.vercel.app/og-image.png`, so links shared on Telegram or Facebook show the image.

## Licence

MIT for this project (see `LICENSE`). PeerJS is MIT licensed (see `vendor/PEERJS-LICENSE.txt`).
