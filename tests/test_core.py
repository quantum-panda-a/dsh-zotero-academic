"""
Unit test suite for Python engine and hybrid search functionality.
"""

import unittest
from engine.core import ZoteroCore

class TestZoteroCore(unittest.TestCase):
    def setUp(self):
        self.core = ZoteroCore()

    def test_core_initialization(self):
        self.assertIsNotNone(self.core)
        self.assertTrue(hasattr(self.core, "hybrid_search"))
        self.assertTrue(hasattr(self.core, "search_items"))
        self.assertTrue(hasattr(self.core, "semantic_search"))
        self.assertTrue(hasattr(self.core, "read_paper"))

    def test_hybrid_search_fallback_on_empty(self):
        # Searching for random gibberish should return empty list gracefully
        res = self.core.hybrid_search("xyznonexistentterm99999", limit=3, mode="keyword")
        self.assertIsInstance(res, list)
        self.assertEqual(len(res), 0)

if __name__ == "__main__":
    unittest.main()
