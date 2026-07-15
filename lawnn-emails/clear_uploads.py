"""
Lawnn — empty the storage buckets (lawnn-private + lawnn-public).

Deletes every uploaded file (chat attachments, application files, job
attachments) via the Supabase Storage API. The database rows are already gone;
this clears the actual files.

Run:
  pip install requests
  set SUPABASE_URL=https://<your-project>.supabase.co     (from backend/.env)
  set SUPABASE_SERVICE_ROLE_KEY=eyJ...                     (from backend/.env)
  python clear_uploads.py
"""

import os
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
BUCKETS      = ["lawnn-private", "lawnn-public"]

if not (SUPABASE_URL and SERVICE_KEY):
    raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (both are in backend/.env).")

HEADERS = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
           "Content-Type": "application/json"}


def list_files(bucket, prefix=""):
    """Recursively collect every file path under prefix."""
    paths = []
    resp = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/list/{bucket}",
        headers=HEADERS,
        json={"prefix": prefix, "limit": 1000, "offset": 0,
              "sortBy": {"column": "name", "order": "asc"}},
        timeout=30,
    )
    resp.raise_for_status()
    for item in resp.json():
        name = item.get("name")
        if not name:
            continue
        full = f"{prefix}{name}"
        if item.get("id") is None:            # a folder → recurse
            paths.extend(list_files(bucket, full + "/"))
        else:                                  # a file
            paths.append(full)
    return paths


def delete_files(bucket, paths):
    # Storage API deletes in batches; 100 at a time is safe.
    for i in range(0, len(paths), 100):
        chunk = paths[i:i + 100]
        resp = requests.delete(
            f"{SUPABASE_URL}/storage/v1/object/{bucket}",
            headers=HEADERS,
            json={"prefixes": chunk},
            timeout=30,
        )
        if resp.status_code >= 300:
            raise RuntimeError(f"Delete failed ({bucket}) {resp.status_code}: {resp.text}")


def main():
    total = 0
    for bucket in BUCKETS:
        paths = list_files(bucket)
        if paths:
            delete_files(bucket, paths)
        total += len(paths)
        print(f"  {bucket}: deleted {len(paths)} file(s)")
    print(f"\nDone — {total} file(s) removed.")


if __name__ == "__main__":
    main()
