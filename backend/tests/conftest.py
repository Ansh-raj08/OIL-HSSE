import os
import pytest

# Ensure tests run in isolated in-memory DB mode without requiring remote Supabase network credentials
os.environ["USE_IN_MEMORY_DB"] = "true"
