"""
Core service implementation bridging Zotero data, PDF extraction, and ChromaDB vector search.
"""

import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure backward-compatibility alias
if "zotero_mcp" not in sys.modules:
    import engine
    sys.modules["zotero_mcp"] = engine

from engine.local_db import LocalZoteroReader, PERSONAL_LIBRARY_GROUP_ID
from engine.semantic_search import create_semantic_search, ZoteroSemanticSearch
from engine.extract import extract_file

logger = logging.getLogger("zotero_core")

class ZoteroCore:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path
        self._reader: Optional[LocalZoteroReader] = None
        self._semantic: Optional[ZoteroSemanticSearch] = None

    @property
    def reader(self) -> LocalZoteroReader:
        if self._reader is None:
            self._reader = LocalZoteroReader(db_path=self.db_path)
        return self._reader

    @property
    def semantic(self) -> ZoteroSemanticSearch:
        if self._semantic is None:
            self._semantic = create_semantic_search(db_path=self.db_path)
        return self._semantic

    def semantic_search(
        self, query: str, limit: int = 5, group_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Run vector semantic search over ChromaDB embeddings."""
        try:
            raw_res = self.semantic.search(query=query, limit=limit, group_id=group_id)
            items = raw_res.get("results", [])
            formatted = []
            for item in items:
                formatted.append({
                    "item_key": item.get("item_key", ""),
                    "title": item.get("title", "Untitled"),
                    "date": item.get("date", ""),
                    "creators": item.get("creators", ""),
                    "passage": item.get("passage", item.get("text", "")),
                    "page_number": item.get("page_number") or item.get("page"),
                    "score": item.get("score", 0.0),
                    "doi": item.get("doi", "")
                })
            return formatted
        except Exception as e:
            logger.exception("Semantic search failed")
            raise

    def hybrid_search(
        self,
        query: str,
        limit: int = 5,
        mode: str = "hybrid",
        group_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Run Reciprocal Rank Fusion (RRF) hybrid search:
        Fuses SQLite keyword/title search and ChromaDB vector semantic search.
        """
        if mode == "semantic":
            results = self.semantic_search(query=query, limit=limit, group_id=group_id)
            for r in results:
                r["match_type"] = "semantic"
            return results

        if mode == "keyword":
            items = self.search_items(query=query, limit=limit)
            results = []
            for it in items:
                results.append({
                    "item_key": it["key"],
                    "title": it["title"],
                    "date": it["date"],
                    "creators": it["creators"],
                    "passage": it.get("abstract", ""),
                    "page_number": None,
                    "score": 1.0,
                    "doi": "",
                    "match_type": "keyword",
                })
            return results

        # Hybrid Mode: RRF (Reciprocal Rank Fusion)
        k_rrf = 60
        candidate_k = max(limit * 2, 10)

        # 1. Vector Channel
        vector_results = []
        try:
            vector_results = self.semantic_search(query=query, limit=candidate_k, group_id=group_id)
        except Exception as e:
            logger.warning(f"Vector search channel encountered error: {e}")

        # 2. Keyword Channel
        keyword_items = []
        try:
            keyword_items = self.search_items(query=query, limit=candidate_k)
        except Exception as e:
            logger.warning(f"Keyword search channel encountered error: {e}")

        fused_map: Dict[str, Dict[str, Any]] = {}

        # Accumulate Vector Rank
        for rank, v in enumerate(vector_results, start=1):
            key = v["item_key"]
            rrf_score = 1.0 / (k_rrf + rank)
            fused_map[key] = {
                "item_key": key,
                "title": v["title"],
                "date": v["date"],
                "creators": v["creators"],
                "passage": v["passage"],
                "page_number": v.get("page_number"),
                "doi": v.get("doi", ""),
                "rrf_score": rrf_score,
                "in_vector": True,
                "in_keyword": False,
            }

        # Accumulate Keyword Rank
        for rank, k_it in enumerate(keyword_items, start=1):
            key = k_it["key"]
            rrf_score = 1.0 / (k_rrf + rank)
            if key in fused_map:
                fused_map[key]["rrf_score"] += rrf_score
                fused_map[key]["in_keyword"] = True
                if not fused_map[key]["passage"] and k_it.get("abstract"):
                    fused_map[key]["passage"] = k_it["abstract"]
            else:
                fused_map[key] = {
                    "item_key": key,
                    "title": k_it["title"],
                    "date": k_it["date"],
                    "creators": k_it["creators"],
                    "passage": k_it.get("abstract", ""),
                    "page_number": None,
                    "doi": "",
                    "rrf_score": rrf_score,
                    "in_vector": False,
                    "in_keyword": True,
                }

        # Sort by fused RRF score descending
        fused_list = list(fused_map.values())
        fused_list.sort(key=lambda x: x["rrf_score"], reverse=True)

        final_results = []
        for it in fused_list[:limit]:
            if it["in_vector"] and it["in_keyword"]:
                match_type = "hybrid"
            elif it["in_vector"]:
                match_type = "semantic"
            else:
                match_type = "keyword"

            final_results.append({
                "item_key": it["item_key"],
                "title": it["title"],
                "date": it["date"],
                "creators": it["creators"],
                "passage": it["passage"],
                "page_number": it["page_number"],
                "score": round(it["rrf_score"], 4),
                "doi": it["doi"],
                "match_type": match_type,
            })

        return final_results

    def search_items(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search items in SQLite by keywords, title, creators."""
        items = self.reader.search_items_by_text(query=query, limit=limit)
        results = []
        for it in items:
            results.append({
                "key": it.key,
                "title": it.title or "Untitled",
                "date": it.date or "",
                "creators": ", ".join(f"{c.get('firstName', '')} {c.get('lastName', '')}".strip() for c in (it.creators or [])),
                "item_type": it.item_type,
                "abstract": (it.abstract or "")[:300]
            })
        return results

    def read_paper(
        self, item_key: str, start_page: Optional[int] = None, end_page: Optional[int] = None
    ) -> Dict[str, Any]:
        """Read metadata and extracted PDF text for a specific item."""
        item = self.reader.get_item_by_key(item_key)
        if not item:
            return {"error": f"Item '{item_key}' not found"}

        creators_str = ", ".join(f"{c.get('firstName', '')} {c.get('lastName', '')}".strip() for c in (item.creators or []))
        result = {
            "key": item.key,
            "title": item.title or "Untitled",
            "date": item.date or "",
            "creators": creators_str,
            "abstract": item.abstract or "",
            "doi": item.doi or "",
            "pdf_text": "",
            "start_page": start_page,
            "end_page": end_page
        }

        # Try to resolve PDF attachment
        attachments = self.reader.get_attachment_paths(item_key)
        pdf_path = None
        for att in attachments:
            path_str = att.get("path")
            if path_str and (path_str.endswith(".pdf") or path_str.endswith(".PDF")):
                resolved = Path(path_str)
                if resolved.exists():
                    pdf_path = resolved
                    break

        if pdf_path:
            try:
                extracted = extract_file(pdf_path)
                text = extracted.text if hasattr(extracted, "text") else str(extracted)
                # If page filter is given and pages are recorded, slice them if possible
                if hasattr(extracted, "pages") and extracted.pages:
                    pages = extracted.pages
                    s_idx = (start_page - 1) if (start_page and start_page > 0) else 0
                    e_idx = end_page if (end_page and end_page > 0) else len(pages)
                    text = "\n\n--- Page Break ---\n\n".join(pages[s_idx:e_idx])
                elif len(text) > 12000:
                    text = text[:12000] + "\n\n... [Truncated for context length] ..."
                result["pdf_text"] = text
            except Exception as e:
                result["pdf_text"] = f"[Failed to extract text from {pdf_path.name}: {e}]"
        else:
            result["pdf_text"] = "[No local PDF attachment found for this item]"

        return result

    def get_annotations(self, item_key: str) -> List[Dict[str, Any]]:
        """Get annotations and notes for an item."""
        annots = self.reader.search_annotations_local(item_keys=[item_key])
        notes = self.reader.search_notes_local(item_keys=[item_key])
        res = []
        for a in annots:
            res.append({
                "type": a.get("type", "highlight"),
                "text": a.get("text", ""),
                "comment": a.get("comment", ""),
                "page": a.get("page")
            })
        for n in notes:
            res.append({
                "type": "note",
                "text": n.get("note", ""),
                "comment": "",
                "page": None
            })
        return res

    def add_paper(self, identifier: str) -> Dict[str, Any]:
        """Add paper by DOI or arXiv ID using Zotero Local/Web client."""
        from engine.tools import write as write_tools
        # Attempt DOI or arXiv addition
        identifier = identifier.strip()
        if identifier.startswith("10.") or "doi.org" in identifier:
            return write_tools.add_by_doi(identifier)
        elif "arxiv.org" in identifier or identifier.startswith("arxiv:"):
            from engine.tools._helpers import _normalize_arxiv_id
            aid = _normalize_arxiv_id(identifier)
            return write_tools.add_by_arxiv(aid)
        else:
            return write_tools.add_by_bibtex(identifier)

    def sync_database(self, action: str = "status") -> Dict[str, Any]:
        """Check status or trigger incremental vector indexing."""
        if action == "status":
            stats = self.semantic.get_stats()
            return {"status": "ok", "stats": stats}
        elif action == "update":
            result = self.semantic.update_database()
            return {"status": "ok", "result": result}
        else:
            return {"status": "error", "message": f"Unknown action: {action}"}
