Migration helper scripts

1. migrate_covers.py

Usage (from repository root):

```bash
# Activate your backend venv and ensure MongoDB is running and the app's config (.env) is set
python backend/tools/migrate_covers.py
```

What it does:

- Scans `base-web-umi/public/covers` for image files.
- For each `Document` in the database, it will try to match a cover by the document's `cover_image` value or by a slugified `title`.
- When a matching file is found, it uploads the image to GridFS and updates `Document.cover_image` to the file id string.

Notes:

- Back up your DB before running this script in production.
- Script assumes the backend's `engine` is configured to connect to your MongoDB.
