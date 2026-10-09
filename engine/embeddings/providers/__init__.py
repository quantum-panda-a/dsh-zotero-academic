"""
Concrete embedding function classes. Only HuggingFace local embedding is retained.
"""

import logging

from chromadb.utils.embedding_functions import register_embedding_function

from zotero_mcp.embeddings.providers.huggingface import HuggingFaceEmbeddingFunction

logger = logging.getLogger(__name__)

__all__ = [
    "CUSTOM_EMBEDDING_FUNCTIONS",
    "HuggingFaceEmbeddingFunction",
    "ensure_embedding_functions_registered",
]

CUSTOM_EMBEDDING_FUNCTIONS = (
    HuggingFaceEmbeddingFunction,
)


def ensure_embedding_functions_registered() -> None:
    """(Re-)claim huggingface embedding-function name in ChromaDB's registry."""
    for cls in CUSTOM_EMBEDDING_FUNCTIONS:
        try:
            register_embedding_function(cls)
        except Exception as e:
            logger.debug(f"Could not re-register {cls.__name__}: {e}")
