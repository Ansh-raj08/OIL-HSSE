import os
import pytest

# Default to false unless explicitly requested by isolated mock unit tests
if "USE_IN_MEMORY_DB" not in os.environ:
    os.environ["USE_IN_MEMORY_DB"] = "false"
