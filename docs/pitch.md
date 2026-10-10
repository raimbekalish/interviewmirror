# Two-minute pitch

I built InterviewMirror because having project experience and explaining it in an
interview are different skills. A student might say, “We built an API,” while the
interviewer still does not know what they personally did or why they made a decision.

The app starts with your resume and a job description. Each question connects an
excerpt of your experience to a requirement from the role.

Here is a deliberately vague answer. Instead of giving a mysterious score, the coach
shows the missing detail and the exact words behind its feedback. This follow-up
asks for my contribution because I only described the team's work.

Now I try the original question again. The comparison shows what I added: my role,
a reason for a technical decision, and an observed result. I can see the difference
and keep the takeaways for my next practice session.

The technical challenge was making feedback inspectable. The server validates
structured responses and checks that every quoted passage actually exists in the
answer or supplied notes. Unsupported quotes are rejected. That checks the source,
not the truth of a claim; this is coaching, not an employment assessment.

I built the interview module independently during WhitHack. The app supports Gemini
and also has an explicitly labeled local heuristic demo. [State which mode you are
actually showing.] My focus was one finished coaching loop that a student can use
on their own schedule, with feedback they can understand and challenge.

# Before presenting

The timed click-by-click script, morning checklist, and fallback plan are in
[demo.md](demo.md).

- Confirm allowed AI-assistance disclosures with the organizers.
- Run the full flow on the presentation laptop, in the intended mode.
- Test the microphone only after the text flow works with a real key.
- Record a short backup screen recording and say when showing recorded output.
- Show the original question, exact quote, reason for the follow-up, and comparison.
- Do not describe the local heuristic engine as live AI or its observations as proof
  of interview readiness.
