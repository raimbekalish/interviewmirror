import type {Assessment, Question} from './types';
import {localAssess, localPlan, grounded} from './local-engine.mjs';

export async function request<T>(path:string, body?:unknown, form?:FormData):Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(), 65000);
  try {
    const response = await fetch('/api/'+path, {method:body || form ? 'POST':'GET', signal:controller.signal,
      headers:form ? undefined : body ? {'Content-Type':'application/json'} : undefined,
      body:form || (body ? JSON.stringify(body) : undefined)});
    let data;
    try { data = await response.json(); } catch { throw new Error('The AI server is not available here. Run the local FastAPI server, or choose Local practice.'); }
    if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Please check your inputs and try again.');
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('The request timed out. Your input is kept; try again.');
    if (error instanceof TypeError) throw new Error('Could not reach the InterviewMirror server. Check that it is still running; your input is kept.');
    throw error;
  } finally { clearTimeout(timeout); }
}

export async function prepare(engine:string, resume:string, job:string):Promise<{questions:Question[]}> {
  const plan = engine === 'local' ? localPlan(resume,job) : await request<{questions:Question[]}>('plan',{resume,job});
  if (!Array.isArray(plan.questions) || plan.questions.length!==3 || !plan.questions.every(q=>typeof q.question==='string' && resume.includes(q.resume_quote) && job.includes(q.job_quote)))
    throw new Error('The questions did not pass source checks. Try again.');
  return plan;
}
export async function evaluate(engine:string,resume:string,job:string,question:Question,answer:string):Promise<Assessment> {
  const result:Assessment = engine === 'local' ? localAssess(answer,question,resume) as Assessment : await request<Assessment>('assess',{resume,job,question,answer});
  if (!result || !Array.isArray(result.criteria) || !grounded(result,answer,resume))
    throw new Error('Feedback did not pass evidence checks. Your answer is kept; try again.');
  return result;
}
