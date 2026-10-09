"""
Engine tools subpackage.
"""
import sys

# Ensure backward-compatible module aliasing
if "zotero_mcp.tools" not in sys.modules:
    sys.modules["zotero_mcp.tools"] = sys.modules[__name__]
