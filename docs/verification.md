# Verification log

Checks run on **October 9, 2026 (evening, Pacific)** on macOS (Apple silicon) with Google
Chrome, a real Gemini API key, and the production build served by FastAPI. Browser checks
used Playwright driving the installed Chrome. These scripts are not part of the repository
because they need a live key and a simulated microphone.

“Simulated microphone” means Chrome’s fake capture device playing a synthetic-voice WAV
file through the real `MediaRecorder` pipeline. It is **not** a physical microphone.

## Feature matrix

| Feature | Status | How it was checked | Evidence |
| --- | --- | --- | --- |
| Question generation (Gemini) | PASS | Live, browser + API | 3 questions; resume and job excerpts confirmed as exact substrings of the inputs in the DOM; ~1.3–1.8 s |
| Questions relate to inputs | PASS | Manual review of live output, CS and psychology resumes | e.g. “Why did you select SQLite specifically for your prototype instead of another database?” |
| Feedback on weak answer | PASS | Live, browser | Contribution rated missing/partial with the quote “We built an API for campus events.” |
| Quotes match the answer exactly | PASS | DOM check on every displayed quote, 5 live assessments | 0 mismatches |
| Follow-up targets a real gap | PASS | Live review | “Which specific part of the FastAPI service did you personally build?” with reason naming ownership |
| Follow-up answer | PASS | Live, browser | Assessed together with the first answer; quotes checked |
| Retry and comparison | PASS | Live, browser | Before = first answer verbatim, after = retry verbatim; comparison rows match both evaluations in order |
| Repeated retries | PASS | JSDOM test | Latest retry compared with the first attempt; “RETRY 2.” label |
| Three questions → takeaways | PASS | Live, browser | “3 of 3 questions practiced” |
| Report export | PASS | Live, browser download | JSON with 3 rounds, first/follow-up/retry preserved, mode and model, no credentials |
| Invented metrics | PASS | Live (several runs) + unit test | Outcome capped at “Needs a closer look”; feedback says an interviewer will ask how it was measured |
| Special characters | PASS | Browser (local mode) | `<script>`, `<img onerror>`, curly quotes, emoji shown as text; nothing executed |
| Empty answer | PASS | Browser + API test | Submit disabled; API returns 422 |
| Request failure | PASS | Browser with forced failures | Network drop and 503: readable message, answer kept, retry works |
| Page refresh | PASS (documented) | Browser | Returns to empty setup; leave warning once answers exist (JSDOM test) |
| Gemini model IDs | PASS | Models list API | `gemini-3.5-flash-lite` and `gemini-flash-lite-latest` available to the key |
| Gemini latency | PASS | 10 sequential live requests | 10/10 succeeded, all answered by the primary model, median 1.9 s, max 2.0 s |
| Fallback on 503 | PASS | Live (earlier in the evening) + unit tests | Primary returned 503, fallback model answered in the same request |
| All models busy | PASS | Live (observed once) + unit test | Clear “Gemini is busy” message, answer kept |
| Invalid key | PASS | Live, server started with a fake key | “Gemini rejected the API credentials…” |
| Missing key | PASS | Live, server started without a key | Health reports `ai_available: false`; Gemini mode disabled; plan returns “not configured” |
| Recording + transcription | PASS (simulated mic) | Chrome fake device → MediaRecorder WebM/Opus → Gemini | Transcript in ~1.3–2 s, editable, appended to an existing draft |
| Mic permission denied | PASS | Chrome without permission | “Microphone access is blocked…”; draft kept |
| No microphone | PASS | Chrome with getUserMedia rejecting NotFoundError | “No microphone was found…” |
| Unsupported browser | PASS | Chrome with MediaRecorder removed | “Recording is unavailable in this browser…” |
| Transcription failure | PASS | Forced 503 and network drop | Recording kept, **Retry transcription** works |
| 60 s auto-stop | UNVERIFIED | Code review only | `setTimeout(… stop, 60000)` |
| Physical microphone | UNVERIFIED | Needs the presenter’s laptop | See the checklist in demo.md |
| Safari / Firefox recording | UNVERIFIED | — | Code requests WebM/Opus or MP4 |
| Layout 1280 / 1440 / 1920 / 390 px | PASS | Screenshots, overflow check | No horizontal overflow, no console errors |

## Automated tests

- `npm test`: 15 passing (UI flow in JSDOM and local engine)
- `pytest backend/tests`: 33 passing (Gemini mocked)
- `npm run build`: clean TypeScript check and production build
- CI runs the same three commands on every push, with no credentials.

## Observed model variance

Repeated live runs of the same answer gave mostly identical ratings, with occasional
one-step differences (for example “Not explained yet” vs “Needs a closer look” for the
weak answer, or the retry’s outcome rated partial in about one run in four). Quote
validation results did not vary.
