"""
Embedding provider registry — dedicated to HuggingFace local models.
"""

import dataclasses
import os
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from typing import Any

from zotero_mcp.embeddings.providers.huggingface import HuggingFaceEmbeddingFunction


@dataclass(frozen=True)
class EnvSpec:
    api_key_vars: tuple[str, ...] = ()
    model_var: str | None = None
    base_url_var: str | None = None
    requires_api_key: bool = False

    def reads_environment(self) -> bool:
        return bool(self.api_key_vars or self.model_var or self.base_url_var)


@dataclass(frozen=True)
class ProviderSpec:
    name: str
    default_model: str | None
    ef_factory: Callable[[dict[str, Any]], Any]
    env: EnvSpec = field(default_factory=EnvSpec)
    model_aliases: Mapping[str, str] = field(default_factory=dict)
    batch: Any | None = None


PROVIDERS: dict[str, ProviderSpec] = {}


def register_provider(spec: ProviderSpec) -> ProviderSpec:
    PROVIDERS[spec.name] = spec
    return spec


def batch_capable_providers() -> list[str]:
    return []


def _huggingface_ef_factory(config: dict[str, Any]) -> Any:
    return HuggingFaceEmbeddingFunction(
        model_name=config.get("model_name", "Qwen/Qwen3-Embedding-0.6B"),
    )


def _onnx_ef_factory(config: dict[str, Any]) -> Any:
    from zotero_mcp.embeddings.providers.onnx import OnnxEmbeddingFunction
    return OnnxEmbeddingFunction(
        model_name=config.get("model_name", "Qwen/Qwen3-Embedding-0.6B"),
    )


register_provider(
    ProviderSpec(
        name="huggingface",
        default_model="Qwen/Qwen3-Embedding-0.6B",
        ef_factory=_huggingface_ef_factory,
        model_aliases={
            "qwen": "Qwen/Qwen3-Embedding-0.6B",
            "embeddinggemma": "google/embeddinggemma-300m",
            "default": "Qwen/Qwen3-Embedding-0.6B",
        },
    )
)

register_provider(
    ProviderSpec(
        name="onnx",
        default_model="Qwen/Qwen3-Embedding-0.6B",
        ef_factory=_onnx_ef_factory,
        model_aliases={
            "onnx-qwen": "Qwen/Qwen3-Embedding-0.6B",
            "default": "Qwen/Qwen3-Embedding-0.6B",
        },
    )
)


def resolve_provider(
    embedding_model: str = "huggingface",
) -> tuple[ProviderSpec, dict[str, Any], dict[str, Any]]:
    huggingface_spec = PROVIDERS["huggingface"]
    target_model = embedding_model
    if not target_model or target_model in ("huggingface", "default"):
        target_model = os.getenv("ZOTERO_EMBEDDING_MODEL") or huggingface_spec.default_model

    if target_model in huggingface_spec.model_aliases:
        return huggingface_spec, {"model_name": huggingface_spec.model_aliases[target_model]}, {}

    return huggingface_spec, {}, {"model_name": target_model}


def create_embedding_function(
    embedding_model: str = "huggingface", embedding_config: dict[str, Any] | None = None
) -> Any:
    spec, defaults, overrides = resolve_provider(embedding_model)
    config = {**defaults, **(embedding_config or {}), **overrides}
    return spec.ef_factory(config)


def merge_env_config(
    embedding_model: str = "huggingface", embedding_config: dict[str, Any] | None = None
) -> dict[str, Any] | None:
    return embedding_config or {}
