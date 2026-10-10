"""Live readiness check before a demo: `.venv/bin/python -m backend.preflight`.

Runs one real question plan and one real assessment through the API with fictional data.
Prints timings and pass/fail only; never prints the API key or provider responses.
"""
from __future__ import annotations

import sys
import time
import warnings

warnings.filterwarnings('ignore', message='Using .httpx. with .starlette.testclient')
from fastapi.testclient import TestClient  # noqa: E402

from backend.main import app  # noqa: E402

RESUME = """Alex Morgan — Computer Science student
Project: Campus Events API
I built a FastAPI service for campus event listings and implemented API-key authentication.
I chose SQLite for a small single-server prototype because setup was simple and the app did not need concurrent writes.
I wrote tests for invalid API keys and duplicate event submissions. Those tests caught a duplicate-record bug before the demo."""
JOB = """Software Engineering Intern — Backend
Build and maintain APIs for user-facing applications.
Explain technical tradeoffs and work with teammates to choose practical solutions.
Write tests, investigate bugs, and improve reliability."""
ANSWER = 'We built an API for campus events. We used Python and FastAPI, and it worked pretty well.'


def main() -> int:
    client = TestClient(app)
    health = client.get('/api/health').json()
    print(f"Key configured: {health['ai_available']}  Model: {health['model']}")
    if not health['ai_available']:
        print('FAIL  Add GEMINI_API_KEY to .env (or export it) and rerun.')
        return 1
    start = time.time()
    plan = client.post('/api/plan', json={'resume': RESUME, 'job': JOB})
    print(f"{'PASS' if plan.status_code == 200 else 'FAIL'}  Questions in {time.time() - start:.1f}s"
          + ('' if plan.status_code == 200 else f" — {plan.json().get('detail')}"))
    if plan.status_code != 200:
        return 1
    question = plan.json()['questions'][0]
    start = time.time()
    result = client.post('/api/assess', json={'resume': RESUME, 'job': JOB, 'question': question, 'answer': ANSWER})
    print(f"{'PASS' if result.status_code == 200 else 'FAIL'}  Feedback in {time.time() - start:.1f}s"
          + ('' if result.status_code == 200 else f" — {result.json().get('detail')}"))
    if result.status_code != 200:
        return 1
    ownership = next(c for c in result.json()['criteria'] if c['key'] == 'ownership')
    print(f"INFO  Vague team answer, ownership observation: {ownership['level']}")
    print('Ready. Warnings above (if any) show when the fallback model was used.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
