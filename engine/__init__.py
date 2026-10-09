"""
Zotero Academic Engine for DeepSeek Harness.
Provides low-latency Zotero data access, PDF parsing, and ChromaDB vector semantic search.
"""

import sys

# Ensure backward-compatible module aliasing so internal imports work
if "zotero_mcp" not in sys.modules:
    sys.modules["zotero_mcp"] = sys.modules[__name__]

__version__ = "1.0.0"
