import test from 'node:test';
import assert from 'node:assert/strict';
import {localPlan,localAssess,grounded,sampleResume,sampleJob,sampleFirst,sampleRetry} from '../frontend/src/local-engine.mjs';

test('all three question sources are literal supplied excerpts',()=>{
  const plan=localPlan(sampleResume,sampleJob);
  assert.equal(plan.questions.length,3);
  for(const q of plan.questions){assert.ok(sampleResume.includes(q.resume_quote));assert.ok(sampleJob.includes(q.job_quote));}
});
test('vague team answer does not demonstrate individual contribution or results',()=>{
  const q=localPlan(sampleResume,sampleJob).questions[0];
  const a=localAssess(sampleFirst,q,sampleResume);
  assert.equal(a.criteria.find(c=>c.key==='ownership').level,'missing');
  assert.equal(a.criteria.find(c=>c.key==='outcome').level,'missing');
  assert.ok(grounded(a,sampleFirst,sampleResume));
});
test('retry can show additional details without changing or inventing evidence',()=>{
  const q=localPlan(sampleResume,sampleJob).questions[0];
  const a=localAssess(sampleRetry,q,sampleResume);
  for(const key of ['ownership','reasoning','outcome'])assert.equal(a.criteria.find(c=>c.key===key).level,'clear');
  assert.ok(grounded(a,sampleRetry,sampleResume));
  assert.equal(a.criteria.find(c=>c.key==='relevance').level,'partial','keyword overlap alone must not prove relevance');
});
test('empty answers are rejected',()=>assert.throws(()=>localAssess('   ',localPlan(sampleResume,sampleJob).questions[0],sampleResume)));
test('unrelated long answer does not pass relevance merely for its length',()=>{
  const text='The weather was cloudy. There were mountains far away. We walked around the lake and admired beautiful scenery.';
  const result=localAssess(text,localPlan(sampleResume,sampleJob).questions[0],sampleResume);
  assert.equal(result.criteria.find(c=>c.key==='relevance').level,'missing');
  assert.ok(grounded(result,text,sampleResume));
});
test('invented quotes fail evidence checking',()=>{
  const a=localAssess(sampleFirst,localPlan(sampleResume,sampleJob).questions[0],sampleResume);
  a.criteria[0].quote='A passage that does not exist';
  assert.equal(grounded(a,sampleFirst,sampleResume),false);
});
