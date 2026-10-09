"""
ONNX Runtime accelerated embedding function for low-memory CPU environments.
"""

import logging
from typing import Any

from chromadb import Documents, Embeddings
from chromadb.utils.embedding_functions import register_embedding_function

from zotero_mcp.embeddings.base import BaseEmbeddingFunction

logger = logging.getLogger(__name__)


@register_embedding_function
class OnnxEmbeddingFunction(BaseEmbeddingFunction):
    """Embedding function backed by ONNX Runtime for ultra-low latency CPU inference."""

    def __init__(self, model_name: str = "Qwen/Qwen3-Embedding-0.6B"):
        self.model_name = model_name

        try:
            from sentence_transformers import SentenceTransformer

            logger.info(f"Attempting to initialize ONNX embedding model: {model_name}")
            try:
                # Use onnx backend if available
                self.model = SentenceTransformer(model_name, backend="onnx", trust_remote_code=True)
                logger.info(f"Successfully initialized ONNX Runtime backend for {model_name}")
            except Exception as e:
                logger.warning(
                    f"ONNX backend initialization failed ({e}), falling back to PyTorch/CPU backend."
                )
                self.model = SentenceTransformer(model_name, trust_remote_code=True)
        except ImportError:
            raise ImportError(
                "sentence-transformers package is required. Install with: pip install sentence-transformers onnxruntime"
            )

        self.max_input_tokens = getattr(self.model, "max_seq_length", 500)

    @staticmethod
    def name() -> str:
        return "onnx"

    def get_config(self) -> dict[str, Any]:
        return {
            "model_name": self.model_name,
        }

    @staticmethod
    def build_from_config(config: dict[str, Any]) -> "OnnxEmbeddingFunction":
        return OnnxEmbeddingFunction(
            model_name=config.get("model_name", "Qwen/Qwen3-Embedding-0.6B"),
        )

    def __call__(self, input: Documents) -> Embeddings:
        """Generate embeddings using ONNX/CPU model."""
        embeddings = self.model.encode(input, convert_to_numpy=True)
        return embeddings.tolist()
