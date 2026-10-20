#!/usr/bin/env python3
"""
OIL HSSE Enterprise SIF-Precursor Decision-Support Platform
Supabase Connection & Schema Verification Script (SIH26165)
"""

import os
import sys

# Ensure backend app is in path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
USE_IN_MEMORY_DB = os.getenv("USE_IN_MEMORY_DB", "false").lower() in ("true", "1", "yes")

print("=" * 80)
print("[OIL HSSE PLATFORM] SUPABASE CONNECTION VERIFIER")
print("=" * 80)
print(f"SUPABASE_URL:              {SUPABASE_URL or '[MISSING]'}")
print(f"SUPABASE_KEY:              {SUPABASE_KEY[:12] + '...' if SUPABASE_KEY else '[MISSING]'}")
print(f"SUPABASE_SERVICE_ROLE_KEY: {'[SET: ' + SUPABASE_SERVICE_ROLE_KEY[:12] + '...]' if SUPABASE_SERVICE_ROLE_KEY else '[NOT SET]'}")
print(f"USE_IN_MEMORY_DB:          {USE_IN_MEMORY_DB}")
print("=" * 80)

if not SUPABASE_URL:
    print("❌ FATAL: SUPABASE_URL is missing in backend/.env")
    sys.exit(1)

active_key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY
if not active_key:
    print("❌ FATAL: Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_KEY is set in backend/.env")
    sys.exit(1)

try:
    from supabase import create_client
except ImportError:
    print("❌ FATAL: supabase library not installed. Run: pip install supabase")
    sys.exit(1)

try:
    print("\nAttempting connection to Supabase...")
    client = create_client(SUPABASE_URL, active_key)
    print("✅ Client initialized successfully.")
except Exception as e:
    print(f"❌ Connection error: {e}")
    sys.exit(1)

print("\nVerifying database tables...")
tables = ["profiles", "datasets", "incidents", "incident_analysis", "incident_reviews", "audit_logs"]
missing_tables = []

for table in tables:
    try:
        res = client.table(table).select("*").limit(1).execute()
        print(f"  ✅ Table '{table}': OK (Rows queryable)")
    except Exception as e:
        print(f"  ❌ Table '{table}': FAILED ({e})")
        missing_tables.append(table)

if missing_tables:
    print("\n" + "=" * 80)
    print("⚠️ TABLES MISSING OR ACCESS DENIED!")
    print(f"The following tables could not be queried: {', '.join(missing_tables)}")
    print("\nAction required:")
    print("  1. If tables do not exist yet, apply 'database/schema/schema.sql' in the Supabase SQL Editor:")
    print(f"     Dashboard -> Project xwacvnrifynictgtkixm -> SQL Editor -> New Query -> Paste schema.sql -> Run")
    print("  2. Ensure SUPABASE_SERVICE_ROLE_KEY is set in backend/.env if using secret access.")
    print("=" * 80)
    sys.exit(2)

print("\n🎉 ALL TABLES VERIFIED IN SUPABASE! Cloud persistence is fully functional.")
sys.exit(0)
