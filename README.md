# InterviewMirror

**You have the experience. Practice explaining it.**

Independent WhitHack 2026 project for the Ingeniux interview-practice challenge.
No Internship Radar integration or imported code.

The app connects a job requirement to a resume excerpt, asks a question, provides
feedback tied to exact answer quotes, asks a targeted follow-up, and lets you retry
the original question. The before/after view compares observations in both attempts.

## Run on your laptop

Requires Node.js 22+ and Python 3.12+. From the extracted project directory:

```bash
cp .env.example .env
```

Open `.env` in your editor and set `GEMINI_API_KEY` to a key from
[Google AI Studio](https://aistudio.google.com/apikey), or export `GEMINI_API_KEY` in your
shell profile (an exported variable takes precedence over `.env`). Keep the key on your
laptop; never put it in frontend code, chat, or a commit. `.env` is git-ignored.

Models are configurable in `.env`. Defaults: `GEMINI_MODEL=gemini-3.5-flash-lite`,
`GEMINI_FALLBACK_MODEL=gemini-flash-lite-latest`, `GEMINI_THINKING_LEVEL=low`. In testing on
2026-10-09 these answered in about 2 s with consistent ratings across repeated runs. The
`gemini-flash-latest` alias took 60–120 s with default thinking (beyond the request timeout),
and `gemini-3.5-flash` returned 503 “high demand” on nearly every request that evening.

Before a demo, check the live connection (prints timings and PASS/FAIL, never the key):

```bash
.venv/bin/python -m backend.preflight
```

```bash
chmod +x start.sh
./start.sh
```

Open **http://127.0.0.1:8000**. The script installs dependencies, builds the React UI,
and serves the UI and API together with FastAPI. Stop it with Ctrl+C. Restart the API
after changing `.env`. No key is needed for the clearly labeled local practice mode.

To install and run manually:

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.lock.txt
npm ci
npm run build
.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Windows: use `.venv\Scripts\python` and `.venv\Scripts\pip` instead of `.venv/bin/…`.

For development, run the API as above and `npm run dev` in a second terminal. Vite
proxies `/api` to FastAPI at port 8000.

## Modes

- **Gemini AI:** stateless server calls with JSON Schema output, Pydantic validation,
  and exact quote validation. Three personalized questions, answer-dependent follow-ups,
  four rubric dimensions, optional resume-grounded hints. Voice input records up to
  60 seconds, transcribes through Gemini, and lets the user edit before submitting.
  Each request tries the primary model, then the fallback model if the first is busy
  (429/5xx), times out (28 s), or fails the evidence checks, then the primary once more
  after a 1 s pause if there is still time within the browser's 65 s limit. The server log names
  the model that failed; it never logs inputs, provider bodies, or the key.
- **Local practice:** fixed question templates and transparent English keyword rules.
  Works without an API key and in the static hosted preview. This mode is **not AI**
  and does not establish semantic understanding; its relevance check remains partial
  even when it finds matching terms. It is useful to exercise the product flow.

**Verified on 2026-10-09** (macOS, Chrome, real Gemini key): question generation and
assessment (typically 2–6 s), the follow-up and retry loop, the comparison and report,
fallback after real `503` responses from the primary model, and recording through
Chrome's MediaRecorder (WebM/Opus) with a synthetic voice played through Chrome's fake
microphone, transcribed by Gemini into the editable answer box. Failure recovery checked
in the browser: blocked microphone, failed transcription with "Retry transcription"
keeping the recording, and a dropped assessment request keeping the typed answer.
Desktop (1440 px) and phone (390 px) layouts were inspected in screenshots.

**Not yet verified:** a physical microphone, Safari/Firefox recording codecs, and the
presentation laptop/network. The hosted preview contains the static UI and local practice
mode only. A “Gemini mode” label means credentials are configured (hover it to see the
model), not that a request has succeeded. Errors keep the user's answer and never switch
engines silently.

## Demo in two minutes

The timed script, demo-morning checklist, and backup plan are in
[docs/demo.md](docs/demo.md). Short version:

1. Load the fictional Campus Events example. Start practice. Point at the resume and job
   excerpts behind the question.
2. Give the vague team answer (“Use example text”). Show the contribution gap, the
   quote it points to, and the follow-up with its reason.
3. Retry the original question (“Use example text”). Show both attempts and the
   criterion changes.
4. Finish, show the takeaways, and say which mode you used.

Example data belongs to a fictional student, Alex Morgan. It is not Raimbek's resume
and is never automatically represented as a real user's qualifications.

## Architecture

```text
React / TypeScript (Vite)
  setup → first answer → feedback → follow-up → retry → comparison → report
           ↓ same-origin HTTP
FastAPI / Pydantic
  /api/plan       Context → 3 questions with checked source excerpts
  /api/assess     Context + question + answer → checked quote-backed rubric
  /api/transcribe Audio → editable transcript
  /api/health     Configuration state, never the key
           ↓ server-held API key in an HTTP header
Gemini generateContent / JSON Schema
```

The Python API does not store sessions, answers, or audio. The frontend keeps state
only in memory for the current tab; reloading clears it. Reports download only when
the user requests an export. No automatic resume updates or achievement attestations.

## Engineering decisions and limitations

- **Four observations instead of an overall score:** relevance, ownership, reasoning,
  and outcome/learning are shown with evidence and specific feedback. No arbitrary
  “87/100” or hiring-success prediction.
- **Exact excerpts:** clear/partial findings require a supporting answer quote. Every
  quote must be a contiguous exact substring. The API rejects fabricated quotes,
  duplicate dimensions, or unsupported resume hints instead of displaying them. A quote
  that differs from the source only in whitespace, curly quotes, or dashes is replaced
  by the source's own text before checking, so what is displayed is always verbatim.
- **Coaching rules:** feedback speaks to “you”; the follow-up is one narrower question
  aimed at the weakest criterion (or at depth when all are clear); next steps may only
  reference details in the answer or resume and say “if accurate”. Claims in an answer
  that are not in the resume are neither praised nor called false; the coach notes that
  an interviewer will likely ask how they were measured. As a deterministic guard, an outcome quote
  containing a number that appears nowhere in the resume is shown as “Needs a closer look”
  rather than “Detail present”.
- **Grounding has limits:** quote validation proves a passage exists, not that the
  achievement is true or the interpretation correct. Gemini feedback can be wrong.
- **No invented model answers:** the coach asks for missing information and gives
  an outline of what to explain; it does not add metrics or achievements.
- **Simple session boundaries:** one follow-up and one retry per question; three
  questions maximum. Sessions are stateless on the server.
- **Bounded requests:** capped text inputs and a 10 MB recording limit, request
  timeouts, clear retry messages, and no provider-key/error-body logging.
- **Voice fallback:** type at any time. Browser recording depends on HTTPS or localhost,
  microphone permission, and codec support. Browser speech synthesis can read questions.
  The transcriber receives the current question and resume only as spelling context for
  names and technical terms; always proofread the transcript before sending.
- **Privacy:** local mode sends no context to Gemini. AI mode sends submitted context
  and answers to Google, and audio only when the microphone feature is used. Google
  processing/retention follows the key's service terms. The app itself has no database.
- **Hosting:** static preview is private and includes only the local heuristic mode.
  Production Python hosting/authentication is outside this hackathon build. The local
  server binds to loopback by default and should not be exposed as a public AI proxy.

## Checks

```bash
npm run build
npm test
.venv/bin/python -m pytest backend/tests -q
```

Tests cover model fallback and provider error mapping, near-exact quote anchoring,
microphone-permission errors, the inline follow-up, literal quote grounding, unsupported citations, duplicate rubric dimensions,
empty/oversized inputs, audio boundaries, API credential/rate-limit/timeout failures,
the local coaching loop, retry comparison, all three questions, and preserving drafts
after a failed AI request. UI interaction checks run in JSDOM; they do not verify layout,
real microphone access, audio codecs, or provider behavior. Browser visual QA was not
available in the build environment.

## API reference

Interactive documentation: http://127.0.0.1:8000/docs

References used during implementation:
- [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output)
- [Gemini audio understanding](https://ai.google.dev/gemini-api/docs/audio)
- [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

## Attribution

Created with AI-assisted implementation for WhitHack. React, Vite, FastAPI, Pydantic,
HTTPX, and Lucide are third-party dependencies. Google Fonts: DM Sans and Instrument
Serif, with system-font fallbacks. No generated images or reused Internship Radar code.
