import os
import sys
from fastapi.testclient import TestClient

# Add app to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app

client = TestClient(app)

print("Testing get /api/v1/renewals without token...")
response = client.get("/api/v1/renewals")
print("Response status:", response.status_code)
print("Response content:", response.json())
