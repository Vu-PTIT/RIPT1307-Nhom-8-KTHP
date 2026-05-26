"""
Script để bulk upload ảnh sách từ một folder

Cách sử dụng:
    python bulk_upload_book_images.py --image-folder "/path/to/images" --csv-file "books.csv"

CSV format:
    document_id,image_filename
    507f1f77bcf86cd799439011,book1.jpg
    507f1f77bcf86cd799439012,book2.jpg

Hoặc dùng tên file để tìm document:
    python bulk_upload_book_images.py --image-folder "/path/to/images" --match-by-title
    (Sẽ dùng tên file để tìm sách theo title)
"""

import os
import sys
import re
import base64
import json
import asyncio
import argparse
import unicodedata
import difflib
from pathlib import Path
from typing import Optional, List
import csv

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
API_ENDPOINT = f"{API_BASE_URL}/api/v1/documents/bulk/upload-images"

# Credentials for testing (should use environment variables or config file)
TEST_USERNAME = os.getenv("TEST_USERNAME", "librarian@example.com")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "password")


async def get_auth_token(username: str, password: str) -> str:
    """Get JWT token for authentication"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_BASE_URL}/api/v1/auth/login",
            json={"username": username, "password": password}
        )
        if response.status_code != 200:
            raise Exception(f"Auth failed: {response.text}")
        data = response.json()
        return data.get("access_token")


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    normalized = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    normalized = re.sub(r"[^a-z0-9\s]", " ", normalized.lower())
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, a, b).ratio()


def choose_best_match(title: str, items: list[dict]) -> Optional[dict]:
    normalized_title = normalize_text(title)
    if not normalized_title or not items:
        return None

    exact_matches = [item for item in items if normalize_text(item.get("title", "")) == normalized_title]
    if exact_matches:
        return exact_matches[0]

    substring_matches = [item for item in items if normalized_title in normalize_text(item.get("title", "")) or normalize_text(item.get("title", "")) in normalized_title]
    if substring_matches:
        return substring_matches[0]

    best_item = max(
        items,
        key=lambda item: similarity(normalize_text(item.get("title", "")), normalized_title)
    )
    best_score = similarity(normalize_text(best_item.get("title", "")), normalized_title)
    if best_score >= 0.60:
        return best_item
    return None


def image_to_base64(image_path: str) -> str:
    """Convert image file to base64 data URI"""
    with open(image_path, "rb") as img_file:
        data = base64.b64encode(img_file.read()).decode()
        # Detect MIME type from extension
        ext = Path(image_path).suffix.lower()
        mime_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif"
        }
        mime = mime_types.get(ext, "image/jpeg")
        return f"data:{mime};base64,{data}"


async def bulk_upload_from_csv(
    image_folder: str, 
    csv_file: str,
    token: str
) -> None:
    """
    Upload images using CSV file with document_id and image_filename mapping
    
    CSV format:
        document_id,image_filename
        507f1f77bcf86cd799439011,book1.jpg
        507f1f77bcf86cd799439012,book2.jpg
    """
    if not os.path.exists(csv_file):
        print(f"❌ CSV file not found: {csv_file}")
        return
    
    images_data = []
    failed_files = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            doc_id = row.get("document_id", "").strip()
            filename = row.get("image_filename", "").strip()
            
            if not doc_id or not filename:
                print(f"⚠️  Skipping row with missing data: {row}")
                continue
            
            image_path = os.path.join(image_folder, filename)
            
            if not os.path.exists(image_path):
                print(f"⚠️  Image file not found: {image_path}")
                failed_files.append(filename)
                continue
            
            try:
                base64_image = image_to_base64(image_path)
                images_data.append({
                    "document_id": doc_id,
                    "cover_image": base64_image
                })
                print(f"✓ Loaded: {filename} ({doc_id})")
            except Exception as e:
                print(f"❌ Error reading {filename}: {e}")
                failed_files.append(filename)
    
    if not images_data:
        print("❌ No valid images to upload")
        return
    
    # Upload to API
    print(f"\n📤 Uploading {len(images_data)} images...")
    
    async with httpx.AsyncClient(timeout=60) as client:
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.post(
            API_ENDPOINT,
            json=images_data,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Upload complete!")
            print(f"   Success: {result['success']}")
            print(f"   Failed: {result['failed']}")
            
            if result['failed'] > 0:
                print("\n❌ Failed uploads:")
                for res in result['results']:
                    if res['status'] == 'failed':
                        print(f"   {res['document_id']}: {res.get('error', 'Unknown error')}")
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(response.text)
    
    if failed_files:
        print(f"\n⚠️  Skipped {len(failed_files)} files:")
        for f in failed_files:
            print(f"   - {f}")


async def bulk_upload_by_filename(
    image_folder: str,
    token: str,
    match_by_title: bool = False
) -> None:
    """
    Upload images by matching filename to document title
    
    Example:
        Filename: "The Great Gatsby.jpg"
        Will find document with title containing "The Great Gatsby"
    """
    print(f"📁 Scanning {image_folder}...")
    
    # Get all image files
    image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
    image_files = [
        f for f in os.listdir(image_folder)
        if Path(f).suffix.lower() in image_extensions
    ]
    
    if not image_files:
        print(f"❌ No image files found in {image_folder}")
        return
    
    print(f"Found {len(image_files)} image files")
    
    # For each image, try to find matching document
    images_data = []
    failed_files = []
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {token}"}
        
        for filename in image_files:
            # Extract title from filename
            title = Path(filename).stem  # Remove extension
            
            print(f"🔍 Looking for: {title}")
            
            # Search for document by title
            search_response = await client.get(
                f"{API_BASE_URL}/api/v1/documents",
                params={"keyword": title, "page": 1, "page_size": 20},
                headers=headers
            )
            
            if search_response.status_code != 200:
                print(f"   ❌ Search failed")
                failed_files.append(filename)
                continue
            
            data = search_response.json()
            items = data.get("items") or []
            match = choose_best_match(title, items)
            if not match:
                print(f"   ❌ Document not found")
                if items:
                    print("   Candidates:")
                    for item in items[:3]:
                        print(f"      - {item.get('title')} ({item.get('id')})")
                failed_files.append(filename)
                continue
            
            doc_id = match.get("id")
            image_path = os.path.join(image_folder, filename)
            
            try:
                base64_image = image_to_base64(image_path)
                images_data.append({
                    "document_id": doc_id,
                    "cover_image": base64_image
                })
                print(f"   ✓ Found: {data['items'][0]['title']} ({doc_id})")
            except Exception as e:
                print(f"   ❌ Error: {e}")
                failed_files.append(filename)
    
    # Upload to API
    if images_data:
        print(f"\n📤 Uploading {len(images_data)} images...")
        
        async with httpx.AsyncClient(timeout=60) as client:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.post(
                API_ENDPOINT,
                json=images_data,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"\n✅ Upload complete!")
                print(f"   Success: {result['success']}")
                print(f"   Failed: {result['failed']}")
            else:
                print(f"❌ Upload failed: {response.status_code}")
                print(response.text)
    
    if failed_files:
        print(f"\n⚠️  Skipped {len(failed_files)} files")


async def main():
    parser = argparse.ArgumentParser(description="Bulk upload book cover images")
    parser.add_argument(
        "--image-folder",
        required=True,
        help="Path to folder containing image files"
    )
    parser.add_argument(
        "--csv-file",
        help="CSV file with document_id and image_filename mapping"
    )
    parser.add_argument(
        "--match-by-title",
        action="store_true",
        help="Match images to documents by filename (book title)"
    )
    parser.add_argument(
        "--username",
        default=TEST_USERNAME,
        help="Username for authentication"
    )
    parser.add_argument(
        "--password",
        default=TEST_PASSWORD,
        help="Password for authentication"
    )
    parser.add_argument(
        "--api-url",
        default=API_BASE_URL,
        help="API base URL"
    )
    
    args = parser.parse_args()
    
    # Validate image folder
    if not os.path.isdir(args.image_folder):
        print(f"❌ Image folder not found: {args.image_folder}")
        sys.exit(1)
    
    # Get authentication token
    print(f"🔐 Authenticating...")
    try:
        token = await get_auth_token(args.username, args.password)
        print(f"✅ Authenticated")
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        sys.exit(1)
    
    # Choose upload method
    if args.csv_file:
        await bulk_upload_from_csv(args.image_folder, args.csv_file, token)
    elif args.match_by_title:
        await bulk_upload_by_filename(args.image_folder, token, match_by_title=True)
    else:
        print("❌ Please specify either --csv-file or --match-by-title")
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
