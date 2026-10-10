# Pitch — InterviewMirror (WhitHack 2026, solo)

Clicks and timing are in [demo.md](demo.md). This page is what you say.

## Two-minute script

**0:00 — Problem (setup screen open)**
“Most students I know have done real projects. The hard part is explaining them in an
interview. You say ‘we built an API and it worked pretty well’, and the interviewer still
has no idea what *you* did. Practicing alone doesn’t help much, because nobody tells you
what’s missing.”

**0:20 — Product (load the example, start)**
“InterviewMirror is a practice coach built around your own experience. I paste a resume
and a job description — this is a fictional student — and it asks three questions. Each
one shows the exact resume line and the exact job requirement it came from, so you know
why you’re being asked.”

**0:40 — Weak answer (use example text, submit)**
“I’ll answer the way a lot of us actually do: ‘We built an API for campus events. We used
Python and FastAPI, and it worked pretty well.’”
(pause for feedback, ~2 seconds)
“There’s no score. It looks at four things: did I answer the question, what did I
personally do, why did I make a decision, and what happened. And every observation quotes
my own words, so I can see exactly what it’s reacting to. Here it points out that I never
said what I personally did. I only said ‘we’.”

**1:10 — Wow moment (point at follow-up, retry, submit)**
“It asks one follow-up aimed at that gap and tells me why. It doesn’t write the answer for
me. Now I try the original question again, this time with what I did, why I chose SQLite,
and what my tests caught.”
(pause, ~2 seconds)
“And this is the part I care about: the same question, before and after, side by side. It
shows which parts improved and what still needs work, straight from the two evaluations.”

**1:35 — Technical**
“Under the hood, Gemini returns structured JSON, and my FastAPI server checks it before
anything reaches the screen. Every quote has to appear word for word in what you wrote, or
the response is rejected. If Gemini is overloaded, which happened a lot while I was
testing, it retries on a fallback model. And it never pretends a quote proves an
achievement is true. It only proves you said it.”

**1:50 — Close**
“So it’s not a chatbot that tells you you did great. It shows you the missing detail, lets
you fix it, and shows you that you fixed it. I built it solo for WhitHack. This demo is
running live on Gemini.”
(If you are showing the recording or local mode, say that instead. See demo.md.)

## If the time limit is 3 or 5 minutes

The two-minute script is the core. Add blocks, don’t stretch sentences.

**3 minutes** (two-minute script plus about 60 seconds):
- After the weak-answer feedback, click **Answer the follow-up**, then **Use example text**
  and **Reflect my answer**: “When I answer the follow-up, it re-reads both parts together.”
  Then continue with **Try the original again** as usual. (+30 s, one extra Gemini call)
- In the technical part, add: “Each response says which model actually answered, so I can
  tell a fallback from the primary model. No database: the session lives in the browser tab,
  which is better for privacy.” (+15 s)
- Close with the takeaways screen and **Download report**. (+15 s)

**5 minutes** (three-minute version plus about two minutes):
- **Voice (+40 s, only if the microphone check passed that morning):** on a question screen
  click **Speak your answer**, say one sentence, **Stop**, show the editable transcript:
  “Speech goes to Gemini for transcription, and I can fix any word before submitting.”
- **Honesty guard (+40 s):** after the comparison, click **Next question**, type
  “I chose SQLite because setup was simple, and the app was used by 5,000 students in the
  first week.” and submit: “That number isn’t in my
  resume. It doesn’t praise it and doesn’t call it false. It says an interviewer will ask
  how I measured it, and plain code caps that result at ‘needs a closer look’.” (Ratings
  vary, so describe what appears.)
- **Tradeoffs (+30 s):** no accounts or database, local-only server, model variance, and
  voice tested only with a simulated microphone (see “Honest tradeoffs” below).
- Leave 10–20 s for questions.

## 30-second emergency pitch

“InterviewMirror helps students explain their own experience in interviews. You paste
your resume and a job description, it asks three questions tied to exact lines from both,
and it gives feedback on four things: answering the question, your personal contribution,
your reasoning, and the result. Every piece of feedback quotes your exact words, and the
server rejects any quote that isn’t really there. Then you retry the same question and see
what improved. I built it solo with React, FastAPI, and Gemini.”

## Three likely questions from judges

**“How is this different from asking ChatGPT to grade my answer?”**
“Three things. The questions come from specific lines in your resume and the job posting,
and it shows you which. The feedback has to cite your exact words, and my server checks
every quote against what you actually wrote and rejects the response if it doesn’t match.
And it keeps the session structured: one follow-up, then a retry of the same question, so
you can compare before and after instead of getting a new essay every time.”

**“What if Gemini is wrong or makes things up?”**
“It can be wrong about judgment, so I don’t show a score or hiring prediction, and the
quotes let you check what it’s reacting to. What it can’t do is put words in your mouth:
quotes are validated on the server, the prompts forbid adding facts or numbers, and next
steps can only mention things already in your answer or resume. If an answer claims a
number that isn’t in the resume, it’s capped at ‘needs a closer look’ by plain code, not by
the model.”

**“What was the hardest part?”**
“Reliability. The default model I started with took over a minute per request, and later
Google kept returning ‘high demand’ errors. I measured a few models, switched to a fast one,
and added a fallback with a strict time budget so the browser never waits forever and your
answer is never lost. I also had to tune the prompts after seeing real output: it was
praising made-up metrics and suggesting details that weren’t in the resume.”

## Engineering decisions worth mentioning

1. **Validate model output on the server instead of trusting it.** JSON Schema output plus
   Pydantic plus exact-substring quote checks. Bad responses are retried or rejected, never
   shown.
2. **No score.** Four observable criteria with quoted evidence, because a number like 72/100
   isn’t actionable and can’t be checked.
3. **Bounded fallback.** Primary model → fallback model → one more try, inside a 65-second
   budget, with the model that answered recorded in a response header. Recoverable errors
   keep the user’s text.

## Honest tradeoffs (if asked)

- No accounts or database: sessions live in the browser tab. Faster to build and better
  for privacy; the cost is that a reload clears the session (the app warns first).
- Runs locally: the server has no authentication, so it isn’t deployed as a public site.
- Ratings vary a little between runs; the quote checks don’t.
- Voice was tested with a simulated microphone in Chrome; typing always works.

## Things not to claim

- Don’t say it verifies experience or proves achievements.
- Don’t call local mode AI or a recording live.
- Don’t invent users, metrics, or teammates. It’s a solo project.
