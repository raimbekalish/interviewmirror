# Demo plan — WhitHack, Saturday October 10, 2026, 9:30 AM Pacific

What you say is in [pitch.md](pitch.md). This page is what you click, and what to do if
something breaks.

The live path makes **three Gemini calls** (questions, first feedback, retry feedback). On
the evening of October 9 they each took about 1.5–2 s.

## Demo data (built into the app)

Use **Load an example** and **Use example text**. Everything is fictional and consistent:

- **Resume:** Alex Morgan, Campus Events API (FastAPI, API-key authentication, SQLite
  chosen for a single-server prototype, tests that caught a duplicate-record bug, fixed with
  a uniqueness check) and a Study Planner React project.
- **Job:** Software Engineering Intern, Backend.
- **Weak answer:** “We built an API for campus events. We used Python and FastAPI, and it
  worked pretty well.”
- **Retry answer:** what Alex implemented, why SQLite, what the tests caught, and the fix.
  Every fact in it is in the resume.

## Click by click (Chrome, http://127.0.0.1:8000, zoom 110%)

| # | Click | What appears | Say (short) |
| --- | --- | --- | --- |
| 1 | Setup screen is already open | Header says **Gemini mode** | Problem |
| 2 | **Load an example** ↗ | Both text boxes fill | “Fictional student” |
| 3 | **Start practicing** | Question 1 in ~2 s | “Tied to exact lines” → point at **Why this question?** |
| 4 | **Use example text** (below the answer box) | Weak answer fills | Read it aloud |
| 5 | **Reflect my answer** | Feedback in ~2 s | Point at the at-a-glance strip, then the **Your contribution** card and its quote |
| 6 | Scroll down a little | Green **One follow-up** box | “One question, aimed at the gap” |
| 7 | **Try the original again** | Same question, empty box | “Now I retry” |
| 8 | **Use example text** → **Reflect my answer** | **See what changed.** at the top, in ~2 s | Point at **Improved**, then the before/after columns |
| 9 | (Optional) **Finish & see takeaways** | Report | Close |

Ratings vary slightly between runs. Usually several criteria improve after the retry. If
one stays at “Needs a closer look”, say: “It still wants more on that part. A retry can
improve, stay the same, or show another gap.” Don’t promise specific labels.

Voice (optional, ~15 s, only if the room is quiet and you tested your microphone that
morning): on any answer screen click **Speak your answer**, say one sentence, click
**Stop**, show the editable transcript. The main path never depends on it.

## Fallback order

1. **Live Gemini** if the morning preflight passes and responses come back in a few
   seconds.
2. **Recording of a real AI run** if Gemini fails twice in a row during the demo, or the
   network is down. Say: “This is a recording of the same flow from last night.”
3. **Local practice mode** if no recording is available. Choose **Local practice** on the
   setup screen and say: “This is the offline mode. Fixed questions and keyword rules, not
   AI.” The loop and the comparison work the same way.

Never present a recording or local mode as live AI.

| Symptom during the demo | Do this |
| --- | --- |
| Spinner longer than ~10 s | Keep talking (technical line). The server retries automatically. |
| Red message: busy / timed out / evidence checks | Click **Reflect my answer** again. The answer is kept. |
| Fails twice, or “Could not reach the server” | Go to fallback 2. |
| Microphone fails | Type. |

## Backup recordings

- **Silent capture (exists):** `demo-backup/interviewmirror-live-flow.webm`, 72 s, recorded
  on the evening of October 9 from a real Gemini run (gemini-3.5-flash-lite) by browser
  automation, with the current layout and demo data. It has **no narration**. Opens in
  Chrome or VLC (QuickTime cannot play WebM).
- **Narrated recording (make it tonight):**
  1. Start the server, open the app in Chrome, zoom 110%, close other tabs.
  2. Press ⌘⇧5, choose **Record Selected Portion** around the Chrome window, then
     **Options → Microphone: MacBook Pro Microphone** (or your mic).
  3. Click **Record**, follow the script once, then click the stop button in the menu bar.
  4. Rename the file to `demo-backup/interviewmirror-demo-narrated.mov` and play it back
     once, start to finish, with sound.

`demo-backup/` is git-ignored and never pushed.

## Physical microphone checklist (do once, ~3 minutes)

1. Chrome, http://127.0.0.1:8000, Gemini mode, load the example, start practicing.
2. Click **Speak your answer**. Chrome asks for the microphone: click **Allow**.
   (If you clicked Block before: click the icon left of the address bar → Microphone →
   Allow → reload.)
3. The button turns red and counts seconds. Say: “I implemented the API-key authentication
   and chose SQLite for the prototype.”
4. Click **Stop**. Within a few seconds the text appears in the answer box and a toast says
   “Transcript added”. An audio player lets you replay the recording.
5. Fix any misspelling in the box (for example “SQ Lite”), then **Reflect my answer**.
6. Optional failure check: turn Wi-Fi off, record and stop. You should see a red message,
   the recording stays, and **Retry transcription** appears. Turn Wi-Fi on and click it.
7. If macOS blocks Chrome entirely: System Settings → Privacy & Security → Microphone →
   enable Google Chrome, then restart Chrome.

## The evening before

- [ ] `./start.sh`, open http://127.0.0.1:8000 in Chrome.
- [ ] `.venv/bin/python -m backend.preflight` prints PASS twice.
- [ ] Run the click-by-click once yourself (including the retry and comparison).
- [ ] Physical microphone checklist (above).
- [ ] Record the narrated backup and play it back.
- [ ] Rehearse the pitch twice with a timer.

## Morning of October 10 (start by 8:30 AM)

- [ ] Connect to the venue Wi-Fi; have a phone hotspot ready.
- [ ] Start the server: `./start.sh` (leave that terminal open).
- [ ] `.venv/bin/python -m backend.preflight` → PASS twice. A line saying an attempt
      “failed (status 503)” above PASS only means the fallback answered.
- [ ] One full request in the browser: load the example, start, submit the example answer.
- [ ] Test the microphone once (steps 2–4 above) if you plan to show voice.
- [ ] Display: mirror or extend the screen, Chrome zoom 110–125%, hide bookmarks bar
      (⌘⇧B), full screen (⌃⌘F).
- [ ] Open the backup video in Chrome in a second tab and check it plays.
- [ ] Reload the app (setup screen), header says **Gemini mode**.
- [ ] Turn on Do Not Disturb; quit Slack, Messages, Mail, and anything that pops up.
- [ ] Say the pitch out loud once.
