import sys
sys.path.insert(0, '.')
from fastapi.testclient import TestClient
from app.main import app

headers = {'Authorization':'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODAxMzQzNzIsInN1YiI6IjZhMDQ3NDA3YzFmNjk2OTVmZTRhZTQ4YSJ9.OA5BFOn0Qz0sJ2sXEutGLRZqvKkBWRF1o0gqgpLS1Xs'}
paths = ['/api/v1/borrows', '/api/v1/renewals']
with TestClient(app) as client:
    for path in paths:
        r = client.get(path, headers=headers)
        print('===', path)
        print('status', r.status_code)
        print('body:', r.text)
