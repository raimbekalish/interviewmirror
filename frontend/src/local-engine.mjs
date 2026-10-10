/** A transparent English-language heuristic demo. This is NOT an AI model. */
export const sampleResume = `Alex Morgan — Computer Science student
Project: Campus Events API
I built a FastAPI service for campus event listings and implemented API-key authentication.
I chose SQLite for a small single-server prototype because setup was simple and the app did not need concurrent writes.
I wrote tests for invalid API keys and duplicate event submissions. Those tests caught a duplicate-record bug before the demo.
Project: Study Planner
I developed a React interface that helps students organize weekly tasks. I changed the layout after two classmates struggled to find the add-task button.`;
export const sampleJob = `Software Engineering Intern — Backend
Build and maintain APIs for user-facing applications.
Explain technical tradeoffs and work with teammates to choose practical solutions.
Write tests, investigate bugs, and improve reliability.
Experience with Python, JavaScript, and relational databases is helpful.`;
export const sampleFirst = 'We built an API for campus events. We used Python and FastAPI, and it worked pretty well.';
export const sampleRetry = 'I implemented the event-listing endpoints and API-key authentication in our FastAPI service. I chose SQLite because we had a small single-server prototype and did not need concurrent writes. I wrote tests for invalid keys and duplicate submissions; the duplicate test caught a record-creation bug before our demo.';

const sentences = text => (text.match(/[^.!?\n]+(?:[.!?]+|$)/g) || [text]).map(s => s.trim()).filter(Boolean);
const words = text => (text.toLowerCase().match(/[a-z][a-z0-9+#-]{2,}/g) || []).filter(w => !new Set(['the','and','for','with','that','this','from','your','what','how','did','you','was','our','have','used','built','project','about','one','would','were','which','because','into','their','then','they','there']).has(w));
const pick = (text, pattern) => sentences(text).find(s => pattern.test(s)) || sentences(text).find(s => s.length > 25) || text.trim();

export function localPlan(resume, job) {
  const rq = pick(resume, /\b(built|implemented|developed|created|designed|project:)\b/i).slice(0, 450);
  const jq = pick(job, /\b(API|backend|develop|build|software|design)\b/i).slice(0, 450);
  const tradeoff = pick(job, /\b(tradeoff|decision|solution|technical|design)\b/i).slice(0, 450);
  const results = pick(job, /\b(test|reliab|bug|result|improve)\b/i).slice(0, 450);
  return {questions: [
    {question: 'Walk me through this experience. What did you personally build or contribute?', topic: 'Your contribution', resume_quote: rq, job_quote: jq, why: 'Practice connecting this experience to a requirement from the role. These excerpts were selected with local keyword rules.'},
    {question: 'Describe one decision you made in this experience. Why did you choose that approach over an alternative?', topic: 'A decision that mattered', resume_quote: rq, job_quote: tradeoff, why: 'Explain the reasoning behind your work. The local demo uses a fixed tradeoff question with excerpts from your inputs.'},
    {question: 'How did you check whether your work was successful? Tell me about a result, a test, or something you learned.', topic: 'Results & learning', resume_quote: rq, job_quote: results, why: 'Practice supporting your explanation with an observed result. The local demo does not verify the truth of your claims.'}
  ]};
}

export function localAssess(answer, question, resume) {
  if (answer.trim().length < 10) throw new Error('Write at least a short sentence before requesting feedback.');
  const chunks = sentences(answer);
  const sourceTerms = new Set(words(question.resume_quote));
  const relevant = chunks.find(s => words(s).some(w => sourceTerms.has(w)));
  const owned = chunks.find(s => /\bI\s+(?:personally\s+)?(?:built|implemented|designed|wrote|developed|created|fixed|tested|chose|changed|led|organized|analyzed|handled|added)\b/i.test(s));
  const reason = chunks.find(s => /\b(because|tradeoff|rather than|instead of|so that|compared to)\b/i.test(s) && words(s).length >= 8);
  const outcome = chunks.find(s => /\b(caught|learned|found|reduced|increased|improved|prevented|resolved|passed|failed|feedback|result)\b/i.test(s) && words(s).length >= 6);
  const criteria = [
    {key:'relevance', label:'Answers the question', level: relevant ? 'partial' : 'missing', quote: relevant || '', feedback: relevant ? 'This sentence shares terms with your selected experience. Check that it actually answers the question; keyword overlap alone cannot establish relevance.' : 'Connect your answer to the selected experience and the question being asked.'},
    {key:'ownership', label:'Your contribution', level: owned ? 'clear' : /\bI\b/.test(answer) ? 'partial' : 'missing', quote: owned || chunks.find(s => /\bI\b/.test(s)) || '', feedback: owned ? 'You name a personal action. Add the scope of your contribution if it is still unclear.' : 'Name one component, decision, or task you personally handled. “We” alone leaves your role unclear.'},
    {key:'reasoning', label:'Decision & reasoning', level: reason ? 'clear' : 'missing', quote: reason || chunks.find(s => /\b(used|chose|selected)\b/i.test(s)) || '', feedback: reason ? 'You include a reason or alternative. Explain the tradeoff that mattered in your situation.' : 'Explain why you chose an approach. Naming a tool does not explain the decision.'},
    {key:'outcome', label:'Result or learning', level: outcome ? 'clear' : 'missing', quote: outcome || '', feedback: outcome ? 'You describe a result or learning. Explain how you observed it, if that is not yet clear.' : 'Describe an actual test, observed result, or lesson. A number is optional; invented metrics are never needed.'}
  ];
  const target = criteria.find(c => c.level === 'missing') || criteria.find(c => c.level === 'partial') || criteria[0];
  const followups = {
    relevance:'How does this example connect to the experience we selected and the original question?',
    ownership:'Which specific part did you personally implement, and what did your teammates handle?',
    reasoning:'You named an approach. What problem did it solve, and what alternative did you consider?',
    outcome:'What did you observe or test that showed whether the work was successful?'
  };
  const hintPattern = {relevance:/\b(project|built|developed)\b/i, ownership:/\bI\s+(implemented|built|wrote)\b/i, reasoning:/\b(because|chose|tradeoff)\b/i, outcome:/\b(test|caught|learned|result|feedback)\b/i}[target.key];
  const hint = sentences(resume).find(s => hintPattern.test(s) && !answer.includes(s));
  return {
    summary: criteria.some(c => c.level === 'missing') ? 'There is a useful starting point here. Focus on one missing detail before you try the answer again.' : 'You now include a contribution, a reason, and an outcome. Check that they answer the question clearly.',
    criteria, followup:followups[target.key], followup_reason:target.feedback,
    next_step:target.feedback + ' Try the original question again in your own words.',
    resume_hint_quote:hint || '', resume_hint:hint ? 'Your supplied notes contain this detail. If it is accurate and relevant, explain it in your own words.' : ''
  };
}

export function grounded(assessment, answer, resume) {
  if (!assessment || !Array.isArray(assessment.criteria) || assessment.criteria.length !== 4 ||
      !['summary','followup','followup_reason','next_step','resume_hint','resume_hint_quote'].every(k=>typeof assessment[k] === 'string') ||
      !assessment.criteria.every(c=>c && typeof c.key === 'string' && typeof c.label === 'string' && typeof c.feedback === 'string' && typeof c.quote === 'string' && ['clear','partial','missing'].includes(c.level))) return false;
  const keys = new Set(assessment.criteria.map(c => c.key));
  return keys.size === 4 && ['relevance','ownership','reasoning','outcome'].every(k=>keys.has(k)) &&
    assessment.criteria.every(c => (!c.quote || answer.includes(c.quote)) && (c.level === 'missing' || Boolean(c.quote.trim()))) &&
    (!assessment.resume_hint_quote || resume.includes(assessment.resume_hint_quote));
}
