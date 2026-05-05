# FastAPI Base Backend

A modular, production-ready FastAPI boilerplate.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Run the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

## Structure

- `app/api`: API route handlers.
- `app/core`: Configuration and security.
- `app/db`: Database connection.
- `app/models`: Database models.
- `app/schemas`: Pydantic validation schemas.
- `app/crud`: Database operations logic.

## Documentation

Once running, access:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
