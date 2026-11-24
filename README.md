# Math Board

**Developer: [Sol Ethio Coder](https://sol-ethio-coder.netlify.app)**

A simple whiteboard web app for recording math lessons with OBS Studio. Draw with a mouse on your PC, or with your finger on your phone, and show the board on your PC at the same time.

No build step. No server of your own. It is plain HTML, CSS and JavaScript.

## Features

### Lessons, notes, quizzes and a teaching script

Open **Lessons** in the toolbar (or go to `/lessons.html`). **All 209 lessons** from the course blueprint are in the site: Grade 9 (55), Grade 10 (47), Grade 11 (57) and Grade 12 (50).

Every lesson has four tabs:

- **Notes:** objective, key ideas, worked examples, a common-mistake box and a recap. Print or save as PDF.
- **Quiz:** 6 multiple-choice questions with shuffled options, an explanation after every answer, a score, a review of missed questions and a retry. Questions are a mix of fixed questions and fresh, computer-checked ones, so a retry is never the same.
- **Practice:** unlimited generated questions with a streak counter (80 question generators cover the number work, algebra, geometry, trigonometry, statistics, matrices, complex numbers, calculus and business maths).
- **Teach script:** the S.P.A.R.K. plan for recording that lesson (Spark, Present, Apply, Run, Keep) with a timer, big text, the examples, a “pause and try” problem with its answer, the common mistake and the next lesson. Open it on your phone or a second window while you record the Math Board with OBS.

Also: a **unit test** for every unit (10 mixed questions, 7 correct to pass), progress saved in the learner's browser, search, and a light or dark theme.

> The notes, examples and questions are a complete first draft written for your course. As the mathematics instructor, please read each lesson before you record it and change anything to match your own teaching and the curriculum. Run `npm run check` after every change.

#### Add or edit a lesson

Lessons are written in `data/content-g9b.js` (Grade 9, Units 2–9), `data/content-g10.js`, `data/content-g11.js` and `data/content-g12.js`. (Grade 9 Unit 1 is in `data/content-g9.js` in a longer format.) Each lesson is one line of code:

```js
L('g9-u3-l01',                              // lesson id: grade, unit, lesson (see data/catalog.js)
  'Solve linear equations in one unknown.', // objective
  ['key idea 1', 'key idea 2'],             // key ideas (use **bold** for terms)
  [['Question', 'step 1 | step 2', 'Answer']], // worked examples
  'A common mistake.',                      // common mistake
  ['lin'],                                  // question generators (names in js/gen.js), or []
  [['Extra question?', ['A', 'B', 'C', 'D'], 1, 'Why B is right.']]  // your own questions (answer = position, starting at 0)
);
```

A lesson needs at least one generator **or** at least 3 of your own questions. To add a new generator, add a function to `js/gen.js` (see the examples there) that returns `mc(question, rightAnswer, [wrong1, wrong2, wrong3], explanation)`.

After editing: run `npm run check`, raise the version in `sw.js`, then commit and push.

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

- Sync goes through a free **public relay** (MQTT over secure WebSocket). A relay works on any network, including mobile data and different Wi-Fi networks. The app tries three relays one after another (`broker.hivemq.com`, `broker.emqx.io`, `test.mosquitto.org`).
- The status line shows what is happening: **connecting…**, **online, waiting for another device**, or **1 other device connected**.
- When a new device joins, the host sends its board to it automatically. **Sync now** pushes your board to the other devices again.
- Both devices need internet. If the status says the relay is unreachable, try another network or check that your network does not block secure WebSocket connections.
- The relays are public: anyone who knows your room code could see the drawing. Lesson boards are fine, but do not draw private information.
- Drawing on a single device always works, with or without sync.

#### If a device will not join

1. Open the **link** from the host's **Copy link** button, not the plain address. The link ends with `?room=` and the code. Make sure the link starts with your deployed address (for example `https://your-site.vercel.app`), not `localhost`.
2. Check the status line on both devices. Both should say the room code and **online**.
3. Close and reopen the page on both devices after a new deployment (the app caches its files).
4. Turn off any VPN or data saver that may block WebSocket connections.
5. If the host's room code changed (for example after reloading the host page), open the new link.

## Project structure

```
math-board/
├── index.html              page
├── css/style.css           styles
├── js/app.js               whiteboard logic
├── js/sync.js              phone/PC sync (relay)
├── lessons.html            lessons, notes and quizzes page
├── css/lessons.css         styles for the lessons page
├── js/lessons.js           catalogue, notes, quiz, practice, teach script, unit tests, progress
├── js/gen.js               80 question generators (answers worked out by the computer)
├── data/dsl.js             L(...) short-hand for writing lessons
├── data/catalog.js         all grades, units and lessons
├── data/content-g9.js      Grade 9 Unit 1 (6 lessons, long format)
├── data/content-g9b.js     Grade 9 Units 2-9 (49 lessons)
├── data/content-g10.js     Grade 10 (47 lessons)
├── data/content-g11.js     Grade 11 (57 lessons)
├── data/content-g12.js     Grade 12 (50 lessons)
├── tools/validate-content.js  checks lesson content (npm run check)
├── serve.json              local server settings
├── vendor/mqtt.min.js      MQTT.js 5 (MIT licence), used for the sync relay
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
- After you change any file, raise the version in `sw.js` (`math-board-v7` to `math-board-v8`) so devices load the new files.

## Logos and branding

- `icons/logo.svg` is the Math Board logo. `icons/dev-logo.svg` is the Sol Ethio Coder mark shown in the credit.
- To use your own logo, replace those two SVG files and the PNG files in `icons/` and the favicons in the project root (same file names and sizes), then raise the version in `sw.js`.
- The social preview uses a relative path (`/og-image.png`). After deploying, change `og:image` in `index.html` to the full address, for example `https://your-site.vercel.app/og-image.png`, so links shared on Telegram or Facebook show the image.

## Licence

MIT for this project (see `LICENSE`). MQTT.js is MIT licensed (see `vendor/MQTT-LICENSE.txt`).
