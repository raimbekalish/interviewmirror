# Demo plan — WhitHack, Friday October 10, 2026, 9:30 AM Pacific

Goal: show one complete coaching loop in two minutes, live with Gemini, with a backup
that is honest about what it is.

The live path makes **three Gemini calls**: questions, first feedback, retry feedback.
Each typically takes 2–6 s in testing. Fill each wait with the line in the script.

## Two-minute script

| Time | Do | Say |
| --- | --- | --- |
| 0:00 | Setup screen is already open. | “Having project experience and explaining it in an interview are different skills. A student says ‘we built an API’, and the interviewer still doesn’t know what *they* did.” |
| 0:12 | **Load an example** → **Start practicing**. | “I paste a resume and a job description. This is a fictional student. Gemini picks three questions…” |
| 0:22 | Point at **Why this question?** (sidebar). | “…and every question shows the exact resume line and job requirement it comes from.” |
| 0:32 | **Use example text** → **Reflect my answer**. | “Here’s a deliberately vague answer: ‘We built an API… it worked pretty well.’” (wait ~3 s) |
| 0:42 | Scroll the four observations. Stop on **Your contribution**. | “No mystery score. Four observations, and each one points to the exact words behind it. Here it quotes ‘We built an API’ — my role is missing.” |
| 0:58 | Point at the green **One follow-up** box. | “It asks one follow-up aimed at the biggest gap, and says why. It never writes the answer for me or invents achievements.” |
| 1:08 | **Try the original again** → **Use example text** → **Reflect my answer**. | “Now I retry the same question with my part, one decision and why, and what my tests caught.” (wait ~3 s) |
| 1:20 | Scroll to **See what changed.** | “Before and after, side by side, with the evidence highlighted and the criterion changes.” (Usually 3–4 criteria improve. If one stays at “Needs a closer look”, say: “It still wants more on the result — a retry can improve, stay the same, or reveal another gap.”) |
| 1:32 | Stay on the comparison. | “The hard part was making AI feedback inspectable. The server checks every quote is an exact passage from the answer or resume and rejects anything else. That proves the words exist, not that a claim is true — this is coaching, not an assessment. If Gemini is busy, it retries on a fallback model.” |
| 1:50 | **Finish & see takeaways**. | “I keep the takeaways for my next session. This demo used live Gemini.” |

Optional, only if the room is quiet and time allows (~15 s): on the follow-up screen,
click **Speak your answer**, say one sentence, stop, and show that the transcript lands
in an editable box. Do not make the main path depend on the microphone.

## The evening before

- [ ] `./start.sh` on the presentation laptop, open http://127.0.0.1:8000 in Chrome.
- [ ] `.venv/bin/python -m backend.preflight` prints PASS twice.
- [ ] Run the script above end to end twice, timing it.
- [ ] Record the narrated backup video (below) from a successful live run.
- [ ] Allow the microphone for 127.0.0.1 in Chrome if you plan to show voice.
- [ ] Charge the laptop; turn on Do Not Disturb; close other tabs and apps.

## Demo morning (from 8:30 AM)

- [ ] Join the venue Wi-Fi (have a phone hotspot ready as a second network).
- [ ] Start the server: `./start.sh` (or the manual `uvicorn` command in the README).
- [ ] `.venv/bin/python -m backend.preflight` → PASS twice. A “failed (status 503)” line
      above PASS only means the fallback model answered.
- [ ] Open the app, confirm the header says **Gemini mode**, zoom Chrome to 110–125%.
- [ ] Leave the setup screen open. Have the backup video open in QuickTime in a
      second window.

## If something goes wrong live

| Symptom | Do this |
| --- | --- |
| Spinner past ~15 s | Keep talking (the technical-challenge line). The server tries the fallback model after 28 s at most. |
| Red error “busy / timed out / evidence checks” | Click the same button again; the answer is kept. |
| Fails twice, or no network | Switch to the backup video and say: “This is a recording of the same flow from last night.” |
| No video either | Choose **Local practice** on the setup screen and say: “This is the offline mode — fixed questions and keyword rules, not AI.” The loop is identical. |
| Microphone fails | Type; voice is optional. |

Never present local-mode output or a recording as live AI.

## Backup recording

1. **Narrated video (do this yourself):** after a successful live run, press
   ⌘⇧5 → *Record Selected Portion* around the browser window and follow the script with
   your voice. Save it as `demo-backup/interviewmirror-demo-narrated.mov`.
2. **Silent capture (already made):** `demo-backup/interviewmirror-live-flow.webm` is an
   automated Chrome recording of the same flow with live Gemini output, made on
   2026-10-09. Use it only if the narrated video is missing, and say it is a recording.

`demo-backup/` is git-ignored.

## Claims to avoid

- Don’t say feedback “verifies” or “proves” experience. Quote checks prove a passage
  exists in the input.
- Don’t call local mode AI, and don’t call a recording live.
- Don’t promise hiring outcomes or scores; there are none.
- The microphone was tested with Chrome’s fake device and real Gemini transcription, not
  with every browser; Safari/Firefox codecs are unverified.
