import test, {afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import React from 'react';
import {sampleResume,sampleJob,sampleFirst,sampleRetry,localPlan,localAssess} from '../frontend/src/local-engine.mjs';

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost'});
for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,HTMLDialogElement:dom.window.HTMLDialogElement,MutationObserver:dom.window.MutationObserver,getComputedStyle:dom.window.getComputedStyle,IS_REACT_ACT_ENVIRONMENT:true}))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
window.scrollTo=()=>{};window.confirm=()=>true;
HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
globalThis.fetch=async()=>({ok:true,json:async()=>({ai_available:false})});
await mkdir('.sites-runtime',{recursive:true});
await build({entryPoints:['frontend/src/main.tsx'],outfile:'.sites-runtime/test-app.mjs',bundle:true,platform:'node',format:'esm',loader:{'.css':'empty'},external:['react','react-dom','react-dom/client','react/jsx-runtime','lucide-react'],jsx:'automatic'});
const {App}=await import('../.sites-runtime/test-app.mjs');
const {render,fireEvent,waitFor,cleanup}=await import('@testing-library/react');
afterEach(()=>cleanup());

async function startLocal(){
  globalThis.fetch=async()=>({ok:true,json:async()=>({ai_available:false})});
  const view=render(React.createElement(App));
  fireEvent.click(view.getByRole('button',{name:/Load an example/i}));
  fireEvent.click(view.getByRole('button',{name:/Start practicing/i}));
  await waitFor(()=>view.getByLabelText('Your answer'));
  return view;
}

test('full local flow supports follow-up, retry comparison, and report',async()=>{
  const view=await startLocal();
  assert.ok(view.getByText('Local practice · no AI'));
  fireEvent.change(view.getByLabelText('Your answer'),{target:{value:sampleFirst}});
  fireEvent.click(view.getByRole('button',{name:/Reflect my answer/i}));
  await waitFor(()=>view.getByRole('button',{name:/Answer the follow-up/i}));
  assert.ok(view.getAllByText('Not explained yet',{exact:true,selector:'.level-label'}).length>=1);
  fireEvent.click(view.getByRole('button',{name:/Answer the follow-up/i}));
  assert.ok(view.getByText('WHY THIS FOLLOW-UP'));
  fireEvent.change(view.getByLabelText('Your answer'),{target:{value:'I implemented API-key authentication. My teammate built the interface.'}});
  fireEvent.click(view.getByRole('button',{name:/Reflect my answer/i}));
  await waitFor(()=>view.getByText('AFTER YOUR FOLLOW-UP'));
  fireEvent.click(view.getByRole('button',{name:/Try the original again/i}));
  fireEvent.change(view.getByLabelText('Your answer'),{target:{value:sampleRetry}});
  fireEvent.click(view.getByRole('button',{name:/Reflect my answer/i}));
  await waitFor(()=>view.getByText('See what changed.'));
  assert.ok(view.getByText('01 / BEFORE'));
  assert.ok(view.getByText('02 / AFTER'));
  fireEvent.click(view.getByRole('button',{name:/Finish & see takeaways/i}));
  await waitFor(()=>view.getByRole('button',{name:/Download report/i}));
  assert.ok(view.getByText('1 of 3 questions practiced'));
  assert.ok(view.getByText(/This session used transparent English keyword heuristics/));
});

test('next question starts with fresh draft and finishes exactly three questions',async()=>{
  const view=await startLocal();
  for(let i=0;i<3;i++){
    assert.equal(view.getByLabelText('Your answer').value,'');
    fireEvent.change(view.getByLabelText('Your answer'),{target:{value:sampleFirst}});
    fireEvent.click(view.getByRole('button',{name:/Reflect my answer/i}));
    await waitFor(()=>view.getByRole('button',{name:i===2?/See my takeaways/i:/Next question/i}));
    fireEvent.click(view.getByRole('button',{name:i===2?/See my takeaways/i:/Next question/i}));
    if(i<2)await waitFor(()=>view.getByLabelText('Your answer'));
  }
  await waitFor(()=>view.getByText('3 of 3 questions practiced'));
  assert.equal(view.getAllByText('First attempt',{exact:true}).length,3);
});

test('failed live request keeps the answer and allows retry without silent mode change',async()=>{
  let assessments=0;
  globalThis.fetch=async(path)=>{
    if(path==='/api/health')return {ok:true,json:async()=>({ai_available:true})};
    if(path==='/api/plan')return {ok:true,json:async()=>localPlan(sampleResume,sampleJob)};
    assessments++;
    return assessments===1?{ok:false,json:async()=>({detail:'The AI request timed out. Your input is kept; try again.'})}:{ok:true,json:async()=>localAssess(sampleFirst,localPlan(sampleResume,sampleJob).questions[0],sampleResume)};
  };
  const view=render(React.createElement(App));
  await waitFor(()=>view.getByText('Gemini mode'));
  fireEvent.click(view.getByRole('button',{name:/Load an example/i}));
  fireEvent.click(view.getByRole('button',{name:/Start practicing/i}));
  await waitFor(()=>view.getByLabelText('Your answer'));
  fireEvent.change(view.getByLabelText('Your answer'),{target:{value:sampleFirst}});
  fireEvent.click(view.getByRole('button',{name:/Reflect my answer/i}));
  await waitFor(()=>view.getByRole('alert'));
  assert.equal(view.getByLabelText('Your answer').value,sampleFirst);
  assert.ok(view.getByText('Gemini mode'));
  fireEvent.click(view.getByRole('button',{name:/Reflect my answer/i}));
  await waitFor(()=>view.getByRole('button',{name:/Try the original again/i}));
  assert.equal(assessments,2);
});

test('explanation modal opens and closes',async()=>{
  globalThis.fetch=async()=>({ok:true,json:async()=>({ai_available:false})});
  const view=render(React.createElement(App));
  fireEvent.click(view.getByRole('button',{name:/How it works/i}));
  assert.ok(view.getByRole('dialog').hasAttribute('open'));
  fireEvent.click(view.getByRole('button',{name:/Close explanation/i}));
  assert.equal(document.querySelector('dialog').hasAttribute('open'),false);
});

test('feedback shows the follow-up question and its reason before answering it',async()=>{
  const view=await startLocal();
  fireEvent.change(view.getByLabelText('Your answer'),{target:{value:sampleFirst}});
  fireEvent.click(view.getByRole('button',{name:/Reflect my answer/i}));
  await waitFor(()=>view.getByText('ONE FOLLOW-UP / BASED ON YOUR ANSWER'));
  assert.ok(view.getByText('Which specific part did you personally implement, and what did your teammates handle?'));
  assert.ok(view.getAllByText('Your contribution',{selector:'h4'}).length===1);
});

test('blocked microphone gives a recoverable message and keeps the typed draft',async()=>{
  globalThis.fetch=async(path)=>{
    if(path==='/api/health')return {ok:true,json:async()=>({ai_available:true,model:'gemini-test'})};
    return {ok:true,json:async()=>localPlan(sampleResume,sampleJob)};
  };
  window.MediaRecorder=class{static isTypeSupported(){return true;}};
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{throw new window.DOMException('Permission denied','NotAllowedError');}}});
  const view=render(React.createElement(App));
  await waitFor(()=>view.getByText('Gemini mode'));
  assert.equal(document.querySelector('.engine-status').getAttribute('title'),'Configured model: gemini-test');
  fireEvent.click(view.getByRole('button',{name:/Load an example/i}));
  fireEvent.click(view.getByRole('button',{name:/Start practicing/i}));
  await waitFor(()=>view.getByLabelText('Your answer'));
  fireEvent.change(view.getByLabelText('Your answer'),{target:{value:'A typed draft I want to keep.'}});
  fireEvent.click(view.getByRole('button',{name:/Speak your answer/i}));
  await waitFor(()=>view.getByRole('alert'));
  assert.match(view.getByRole('alert').textContent,/Microphone access is blocked/);
  assert.equal(view.getByLabelText('Your answer').value,'A typed draft I want to keep.');
  assert.equal(view.getByRole('button',{name:/Speak your answer/i}).disabled,false);
  delete window.MediaRecorder;
});

test('comparison summarizes improvements from real levels and repeated retries still compare with the first attempt',async()=>{
  const view=await startLocal();
  fireEvent.change(view.getByLabelText('Your answer'),{target:{value:sampleFirst}});
  fireEvent.click(view.getByRole('button',{name:/Reflect my answer/i}));
  await waitFor(()=>view.getByText('EXPLAINED CLEARLY'));
  assert.ok(view.getByText('NEEDS MORE DETAIL'));
  fireEvent.click(view.getByRole('button',{name:/Try the original again/i}));
  fireEvent.change(view.getByLabelText('Your answer'),{target:{value:sampleRetry}});
  fireEvent.click(view.getByRole('button',{name:/Reflect my answer/i}));
  await waitFor(()=>view.getByText('See what changed.'));
  const improved=document.querySelector('.change-summary .improved p').textContent;
  assert.match(improved,/Your contribution/);assert.match(improved,/Decision & reasoning/);assert.match(improved,/Result or learning/);
  assert.ok(view.getByRole('button',{name:/Next question/i}).className.includes('primary'));
  fireEvent.click(view.getByRole('button',{name:/Retry once more/i}));
  fireEvent.change(view.getByLabelText('Your answer'),{target:{value:sampleFirst+' I wrote the tests.'}});
  fireEvent.click(view.getByRole('button',{name:/Reflect my answer/i}));
  await waitFor(()=>view.getByText(/RETRY 2\./));
  assert.ok(document.querySelector('.comparison-grid article').textContent.includes(sampleFirst),'before stays the first attempt');
  assert.ok(document.querySelector('.comparison-grid article.after').textContent.includes('I wrote the tests.'),'after is the latest retry');
});

test('leaving with answers in progress triggers the browser leave warning',async()=>{
  const view=await startLocal();
  const before=new window.Event('beforeunload',{cancelable:true});window.dispatchEvent(before);
  assert.equal(before.defaultPrevented,false,'no warning before any answer');
  fireEvent.change(view.getByLabelText('Your answer'),{target:{value:sampleFirst}});
  fireEvent.click(view.getByRole('button',{name:/Reflect my answer/i}));
  await waitFor(()=>view.getByText('EXPLAINED CLEARLY'));
  const after=new window.Event('beforeunload',{cancelable:true});window.dispatchEvent(after);
  assert.equal(after.defaultPrevented,true);
});

test('validation errors from the API become a readable message and keep the answer',async()=>{
  globalThis.fetch=async(path)=>{
    if(path==='/api/health')return {ok:true,json:async()=>({ai_available:true})};
    if(path==='/api/plan')return {ok:true,json:async()=>localPlan(sampleResume,sampleJob)};
    return {ok:false,status:422,json:async()=>({detail:[{loc:['body','answer'],msg:'String should have at most 10000 characters'}]})};
  };
  const view=render(React.createElement(App));
  await waitFor(()=>view.getByText('Gemini mode'));
  fireEvent.click(view.getByRole('button',{name:/Load an example/i}));
  fireEvent.click(view.getByRole('button',{name:/Start practicing/i}));
  await waitFor(()=>view.getByLabelText('Your answer'));
  fireEvent.change(view.getByLabelText('Your answer'),{target:{value:sampleFirst}});
  fireEvent.click(view.getByRole('button',{name:/Reflect my answer/i}));
  await waitFor(()=>view.getByRole('alert'));
  assert.match(view.getByRole('alert').textContent,/limited to 10,000 characters/);
  assert.equal(view.getByLabelText('Your answer').value,sampleFirst);
});
