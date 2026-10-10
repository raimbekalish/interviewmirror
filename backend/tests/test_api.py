from copy import deepcopy

import json

import httpx
import pytest
from fastapi.testclient import TestClient

from backend import main

client = TestClient(main.app)
RESUME = 'I built a FastAPI service and wrote authentication tests for invalid API keys.'
JOB = 'Build APIs and write tests to improve software reliability.'
QUESTION = dict(question='What did you personally implement in this project?', topic='Contribution',
                resume_quote='I built a FastAPI service', job_quote='Build APIs',
                why='Connect your personal work to the role requirements.')
ANSWER = 'I built the API because our team needed event listings. My tests caught a duplicate bug.'
ASSESSMENT = dict(
    summary='You explain your contribution and include a concrete test result.',
    criteria=[
        dict(key='relevance', label='Relevance', level='clear', quote='I built the API', feedback='This addresses the selected API project.'),
        dict(key='ownership', label='Ownership', level='clear', quote='I built the API', feedback='You identify a personal contribution.'),
        dict(key='reasoning', label='Reasoning', level='partial', quote='because our team needed event listings', feedback='Explain an alternative you considered.'),
        dict(key='outcome', label='Outcome', level='clear', quote='My tests caught a duplicate bug.', feedback='You name an observed test result.'),
    ],
    followup='Which alternative did you consider for this API?',
    followup_reason='The answer gives a purpose but no alternative or tradeoff.',
    next_step='Add why you chose this approach and what alternative you considered.',
    resume_hint_quote='wrote authentication tests',
    resume_hint='Explain the authentication tests if they are relevant to your answer.')


@pytest.fixture(autouse=True)
def no_credentials(monkeypatch):
    monkeypatch.delenv('GEMINI_API_KEY', raising=False)
    monkeypatch.delenv('GOOGLE_API_KEY', raising=False)
    for name in ('GEMINI_MODEL', 'GEMINI_FALLBACK_MODEL', 'GEMINI_THINKING_LEVEL'):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setattr(main, 'RETRY_BACKOFF', 0)


def test_health_does_not_claim_ai_without_key():
    assert client.get('/api/health').json() == {'status':'ok','ai_available':False,'model':main.DEFAULT_MODEL,'stores_answers':False}


def test_live_api_requires_key():
    response = client.post('/api/plan', json={'resume':RESUME,'job':JOB})
    assert response.status_code == 503
    assert 'not configured' in response.json()['detail']


def test_empty_answer_is_rejected_before_ai_request():
    response = client.post('/api/assess', json={'resume':RESUME,'job':JOB,'question':QUESTION,'answer':''})
    assert response.status_code == 422


def test_all_spaces_answer_is_rejected():
    response = client.post('/api/assess', json={'resume':RESUME,'job':JOB,'question':QUESTION,'answer':' '*15})
    assert response.status_code == 422


def test_long_input_is_rejected():
    assert client.post('/api/plan',json={'resume':'a'*30001,'job':JOB}).status_code == 422


def test_supported_quotes_pass():
    result = main.Assessment.model_validate(ASSESSMENT)
    assert main.validate_assessment(result, ANSWER, RESUME) is result


@pytest.mark.parametrize('change', ['answer_quote','resume_quote','empty_quote','duplicate_dimension'])
def test_invalid_evidence_is_rejected(change):
    data = deepcopy(ASSESSMENT)
    if change == 'answer_quote': data['criteria'][0]['quote'] = 'I increased revenue by 50%.'
    if change == 'resume_quote': data['resume_hint_quote'] = 'I managed a team of twenty.'
    if change == 'empty_quote': data['criteria'][0]['quote'] = ''
    if change == 'duplicate_dimension': data['criteria'][3]['key'] = 'ownership'
    with pytest.raises(ValueError):
        main.validate_assessment(main.Assessment.model_validate(data),ANSWER,RESUME)


def test_missing_evidence_can_have_no_quote():
    data = deepcopy(ASSESSMENT)
    data['criteria'][0].update(level='missing',quote='')
    main.validate_assessment(main.Assessment.model_validate(data),ANSWER,RESUME)


def test_question_cannot_invent_resume_source():
    questions = [dict(QUESTION,question=QUESTION['question']+suffix) for suffix in ('',' Why?',' How?')]
    main.validate_plan(main.Plan(questions=questions),main.Context(resume=RESUME,job=JOB))
    questions = deepcopy(questions)
    questions[0]['resume_quote'] = 'I worked at Google.'
    with pytest.raises(ValueError):
        main.validate_plan(main.Plan(questions=questions),main.Context(resume=RESUME,job=JOB))


def gemini(output):
    return httpx.Response(200,json={'candidates':[{'content':{'parts':[{'text':json.dumps(output)}]}}]})


def fake_provider(monkeypatch,responses):
    """Serve queued provider responses and record which model each attempt used."""
    monkeypatch.setenv('GEMINI_API_KEY','key')
    calls = []
    class FakeClient:
        def __init__(self,*args,**kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self,*args): pass
        async def post(self,url,headers,json):
            calls.append((url.split('/models/')[1].split(':')[0],json))
            response = responses.pop(0)
            if isinstance(response,Exception): raise response
            return response
    monkeypatch.setattr(main.httpx,'AsyncClient',FakeClient)
    return calls


def test_endpoint_rejects_hallucinated_quote(monkeypatch):
    data = deepcopy(ASSESSMENT)
    data['criteria'][0]['quote'] = 'An unsupported accomplishment.'
    calls = fake_provider(monkeypatch,[gemini(data),gemini(data),gemini(data)])
    response = client.post('/api/assess',json={'resume':RESUME,'job':JOB,'question':QUESTION,'answer':ANSWER})
    assert response.status_code == 502
    assert 'evidence checks' in response.json()['detail']
    assert [model for model,_ in calls] == [main.DEFAULT_MODEL,main.DEFAULT_FALLBACK,main.DEFAULT_MODEL]


def test_failed_evidence_check_retries_with_fallback_model(monkeypatch):
    bad = deepcopy(ASSESSMENT)
    bad['criteria'][0]['quote'] = 'An unsupported accomplishment.'
    calls = fake_provider(monkeypatch,[gemini(bad),gemini(ASSESSMENT)])
    response = client.post('/api/assess',json={'resume':RESUME,'job':JOB,'question':QUESTION,'answer':ANSWER})
    assert response.status_code == 200
    assert [model for model,_ in calls] == [main.DEFAULT_MODEL,main.DEFAULT_FALLBACK]


@pytest.mark.parametrize('first',[httpx.Response(503,json={}),httpx.Response(429,json={}),httpx.ReadTimeout('slow')])
def test_busy_or_slow_primary_falls_back(monkeypatch,first):
    calls = fake_provider(monkeypatch,[first,gemini(ASSESSMENT)])
    response = client.post('/api/assess',json={'resume':RESUME,'job':JOB,'question':QUESTION,'answer':ANSWER})
    assert response.status_code == 200
    assert calls[1][0] == main.DEFAULT_FALLBACK


def test_busy_provider_message_after_all_attempts(monkeypatch):
    fake_provider(monkeypatch,[httpx.Response(503,json={})]*3)
    response = client.post('/api/plan',json={'resume':RESUME,'job':JOB})
    assert response.status_code == 503
    assert 'busy' in response.json()['detail']


def test_invalid_key_400_is_reported_as_credentials_without_retry(monkeypatch):
    calls = fake_provider(monkeypatch,[httpx.Response(400,json={'error':{'details':[{'reason':'API_KEY_INVALID'}]}})])
    response = client.post('/api/plan',json={'resume':RESUME,'job':JOB})
    assert 'credentials' in response.json()['detail']
    assert len(calls) == 1


def test_model_and_thinking_level_are_configurable(monkeypatch):
    calls = fake_provider(monkeypatch,[gemini(ASSESSMENT)])
    monkeypatch.setenv('GEMINI_MODEL','gemini-custom')
    monkeypatch.setenv('GEMINI_THINKING_LEVEL','')
    client.post('/api/assess',json={'resume':RESUME,'job':JOB,'question':QUESTION,'answer':ANSWER})
    assert calls[0][0] == 'gemini-custom'
    assert 'thinkingConfig' not in calls[0][1]['generationConfig']


def test_near_exact_quotes_are_replaced_by_the_original_text():
    answer = 'I chose SQLite\nbecause it\u2019s simple \u2014 and it worked.'
    assert main.anchor("I chose SQLite because it's simple - and", answer) == 'I chose SQLite\nbecause it\u2019s simple \u2014 and'
    assert main.anchor('\u201cand it worked.\u201d', answer) == 'and it worked.'
    assert main.anchor('I chose Postgres', answer) == 'I chose Postgres'
    data = deepcopy(ASSESSMENT)
    data['criteria'][3]['quote'] = 'My tests  caught a duplicate bug'
    result = main.validate_assessment(main.Assessment.model_validate(data),ANSWER,RESUME)
    assert result.criteria[3].quote == 'My tests caught a duplicate bug'


def test_criteria_are_returned_in_rubric_order():
    data = deepcopy(ASSESSMENT)
    data['criteria'].reverse()
    result = main.validate_assessment(main.Assessment.model_validate(data),ANSWER,RESUME)
    assert [c.key for c in result.criteria] == ['relevance','ownership','reasoning','outcome']


def test_assess_endpoint_returns_grounded_feedback(monkeypatch):
    fake_provider(monkeypatch,[gemini(ASSESSMENT)])
    response = client.post('/api/assess',json={'resume':RESUME,'job':JOB,'question':QUESTION,'answer':ANSWER})
    assert response.status_code == 200
    assert response.json()['criteria'][0]['quote'] in ANSWER


def test_audio_format_and_size_are_bounded():
    assert client.post('/api/transcribe',files={'file':('bad.exe',b'abc','application/octet-stream')}).status_code == 415
    assert client.post('/api/transcribe',files={'file':('empty.webm',b'','audio/webm')}).status_code == 422
    assert client.post('/api/transcribe',files={'file':('big.webm',b'a'*(10*1024*1024+1),'audio/webm')}).status_code == 413


@pytest.mark.parametrize('status,message', [(429,'rate-limited'),(403,'credentials'),(404,'model is unavailable')])
def test_provider_error_is_useful_and_never_echoes_key(monkeypatch,status,message):
    secret='never-echo-this-key'
    monkeypatch.setenv('GEMINI_API_KEY',secret)
    class FakeClient:
        def __init__(self,*args,**kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self,*args): pass
        async def post(self,url,headers,json):
            assert headers['x-goog-api-key']==secret
            assert secret not in url
            assert json['generationConfig']['responseJsonSchema']['type']=='object'
            return httpx.Response(status,json={'error':{'message':secret}})
    if status == 404: monkeypatch.setenv('GEMINI_FALLBACK_MODEL','')
    monkeypatch.setattr(main.httpx,'AsyncClient',FakeClient)
    response=client.post('/api/plan',json={'resume':RESUME,'job':JOB})
    assert message in response.json()['detail']
    assert secret not in response.text


def test_provider_timeout_preserves_retry_message(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY','key')
    class FakeClient:
        def __init__(self,*args,**kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self,*args): pass
        async def post(self,*args,**kwargs): raise httpx.ReadTimeout('provider timed out')
    monkeypatch.setattr(main.httpx,'AsyncClient',FakeClient)
    response=client.post('/api/plan',json={'resume':RESUME,'job':JOB})
    assert response.status_code==504
    assert 'input is kept' in response.json()['detail']


def test_transcription_uses_notes_only_as_spelling_context(monkeypatch):
    calls = fake_provider(monkeypatch,[gemini({'transcript':'I chose SQLite.'})])
    response = client.post('/api/transcribe',files={'file':('a.webm',b'abc','audio/webm;codecs=opus')},data={'context':'I chose SQLite for a prototype.'})
    assert response.json() == {'transcript':'I chose SQLite.'}
    parts = calls[0][1]['contents'][0]['parts']
    assert 'SPELLING_CONTEXT' in parts[0]['text'] and 'SQLite' in parts[0]['text']
    assert parts[1]['inlineData']['mimeType'] == 'audio/webm'


def test_outcome_with_metric_absent_from_resume_is_capped_at_partial():
    answer = 'I built the API. It was used by over 5,000 students in the first week.'
    data = deepcopy(ASSESSMENT)
    for c in data['criteria']: c['quote'] = 'I built the API.'
    data['criteria'][3]['quote'] = 'It was used by over 5,000 students in the first week.'
    result = main.validate_assessment(main.Assessment.model_validate(data),answer,RESUME)
    assert result.criteria[3].level == 'partial'
    result = main.validate_assessment(main.Assessment.model_validate(data),answer,RESUME+' Used by 5000 students.')
    assert result.criteria[3].level == 'clear'


def test_both_models_busy_then_primary_recovers(monkeypatch):
    calls = fake_provider(monkeypatch,[httpx.Response(503,json={}),httpx.Response(503,json={}),gemini(ASSESSMENT)])
    response = client.post('/api/assess',json={'resume':RESUME,'job':JOB,'question':QUESTION,'answer':ANSWER})
    assert response.status_code == 200
    assert len(calls) == 3


def test_no_third_attempt_after_two_timeouts(monkeypatch):
    clock = iter([0, 60])
    monkeypatch.setattr(main,'monotonic',lambda: next(clock))
    calls = fake_provider(monkeypatch,[httpx.ReadTimeout('slow'),httpx.ReadTimeout('slow')])
    response = client.post('/api/plan',json={'resume':RESUME,'job':JOB})
    assert response.status_code == 504
    assert len(calls) == 2
