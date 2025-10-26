"""
Feature Store for Caching Embeddings
=====================================

Provides efficient caching and retrieval of BERT embeddings and features
to avoid redundant computations and speed up inference.
"""

import logging
from typing import List, Dict, Any, Optional
import hashlib
import json
from datetime import datetime, timedelta
import pickle

logger = logging.getLogger(__name__)


class FeatureStore:
    """
    Feature store for caching BERT embeddings and computed features.

    Features:
    - Hash-based caching of embeddings
    - TTL (time-to-live) support
    - LRU eviction policy
    - Disk persistence
    """

    def __init__(
        self,
        max_cache_size: int = 10000,
        ttl_hours: int = 24,
        persist_path: Optional[str] = None
    ):
        """
        Initialize feature store.

        Args:
            max_cache_size: Maximum number of cached entries
            ttl_hours: Time-to-live for cache entries (hours)
            persist_path: Path to persist cache to disk
        """
        self.max_cache_size = max_cache_size
        self.ttl_hours = ttl_hours
        self.persist_path = persist_path

        # In-memory cache
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._access_times: Dict[str, datetime] = {}

        # Stats
        self.hits = 0
        self.misses = 0

        # Load from disk if available
        if persist_path:
            self._load_from_disk()

    def _compute_hash(self, text: str) -> str:
        """
        Compute hash for text.

        Args:
            text: Input text

        Returns:
            SHA256 hash
        """
        return hashlib.sha256(text.encode('utf-8')).hexdigest()

    def get_embedding(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached embedding for text.

        Args:
            text: Input text

        Returns:
            Cached embedding dictionary or None if not found
        """
        key = self._compute_hash(text)

        if key in self._cache:
            # Check TTL
            if self._is_expired(key):
                self._evict(key)
                self.misses += 1
                return None

            # Update access time
            self._access_times[key] = datetime.now()
            self.hits += 1

            logger.debug(f"Cache hit for text: {text[:50]}...")
            return self._cache[key]

        self.misses += 1
        return None

    def store_embedding(
        self,
        text: str,
        embedding: Any,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Store embedding in cache.

        Args:
            text: Input text
            embedding: Computed embedding (numpy array or list)
            metadata: Optional metadata
        """
        key = self._compute_hash(text)

        # Evict if cache is full
        if len(self._cache) >= self.max_cache_size:
            self._evict_lru()

        # Store entry
        self._cache[key] = {
            'text': text[:100],  # Store truncated text for debugging
            'embedding': embedding,
            'metadata': metadata or {},
            'created_at': datetime.now().isoformat()
        }
        self._access_times[key] = datetime.now()

        logger.debug(f"Cached embedding for text: {text[:50]}...")

        # Persist if configured
        if self.persist_path:
            self._persist_to_disk()

    def batch_get(self, texts: List[str]) -> Dict[str, Optional[Dict[str, Any]]]:
        """
        Retrieve multiple embeddings.

        Args:
            texts: List of texts

        Returns:
            Dictionary mapping text to cached embedding (or None)
        """
        results = {}
        for text in texts:
            results[text] = self.get_embedding(text)
        return results

    def batch_store(
        self,
        texts: List[str],
        embeddings: List[Any],
        metadata_list: Optional[List[Dict[str, Any]]] = None
    ):
        """
        Store multiple embeddings.

        Args:
            texts: List of texts
            embeddings: List of embeddings
            metadata_list: Optional list of metadata dictionaries
        """
        if metadata_list is None:
            metadata_list = [None] * len(texts)

        for text, embedding, metadata in zip(texts, embeddings, metadata_list):
            self.store_embedding(text, embedding, metadata)

    def _is_expired(self, key: str) -> bool:
        """Check if cache entry is expired."""
        if key not in self._access_times:
            return True

        age = datetime.now() - self._access_times[key]
        return age > timedelta(hours=self.ttl_hours)

    def _evict(self, key: str):
        """Evict a cache entry."""
        if key in self._cache:
            del self._cache[key]
        if key in self._access_times:
            del self._access_times[key]

    def _evict_lru(self):
        """Evict least recently used entry."""
        if not self._access_times:
            return

        # Find LRU entry
        lru_key = min(self._access_times, key=self._access_times.get)
        self._evict(lru_key)
        logger.debug(f"Evicted LRU entry: {lru_key}")

    def clear(self):
        """Clear all cache entries."""
        self._cache.clear()
        self._access_times.clear()
        self.hits = 0
        self.misses = 0
        logger.info("Cache cleared")

    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Statistics dictionary
        """
        total_requests = self.hits + self.misses
        hit_rate = self.hits / total_requests if total_requests > 0 else 0

        return {
            'size': len(self._cache),
            'max_size': self.max_cache_size,
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': round(hit_rate, 3),
            'ttl_hours': self.ttl_hours
        }

    def _persist_to_disk(self):
        """Persist cache to disk."""
        if not self.persist_path:
            return

        try:
            with open(self.persist_path, 'wb') as f:
                pickle.dump({
                    'cache': self._cache,
                    'access_times': self._access_times,
                    'hits': self.hits,
                    'misses': self.misses
                }, f)
            logger.debug("Cache persisted to disk")
        except Exception as e:
            logger.error(f"Failed to persist cache: {e}")

    def _load_from_disk(self):
        """Load cache from disk."""
        if not self.persist_path:
            return

        try:
            with open(self.persist_path, 'rb') as f:
                data = pickle.load(f)
                self._cache = data['cache']
                self._access_times = data['access_times']
                self.hits = data.get('hits', 0)
                self.misses = data.get('misses', 0)
            logger.info(f"Cache loaded from disk ({len(self._cache)} entries)")
        except FileNotFoundError:
            logger.info("No cache file found, starting fresh")
        except Exception as e:
            logger.error(f"Failed to load cache: {e}")


class EmbeddingCache:
    """
    Specialized cache for BERT embeddings with smart batching.

    Integrates with FinBERT/BioBERT analyzers to cache embeddings
    and avoid redundant model computations.
    """

    def __init__(
        self,
        feature_store: FeatureStore,
        model,
        tokenizer,
        device: str = "cpu"
    ):
        """
        Initialize embedding cache.

        Args:
            feature_store: Feature store instance
            model: BERT model
            tokenizer: Model tokenizer
            device: Device to run model on
        """
        self.feature_store = feature_store
        self.model = model
        self.tokenizer = tokenizer
        self.device = device

    def get_embeddings(
        self,
        texts: List[str],
        layer: int = -1
    ) -> List[Any]:
        """
        Get embeddings for texts, using cache when possible.

        Args:
            texts: List of texts
            layer: Layer to extract embeddings from (-1 = last layer)

        Returns:
            List of embeddings
        """
        import torch

        embeddings = []
        texts_to_compute = []
        indices_to_compute = []

        # Check cache
        for i, text in enumerate(texts):
            cached = self.feature_store.get_embedding(text)
            if cached:
                embeddings.append(cached['embedding'])
            else:
                embeddings.append(None)
                texts_to_compute.append(text)
                indices_to_compute.append(i)

        # Compute missing embeddings
        if texts_to_compute:
            logger.info(f"Computing {len(texts_to_compute)} embeddings")

            with torch.no_grad():
                # Tokenize
                inputs = self.tokenizer(
                    texts_to_compute,
                    return_tensors="pt",
                    max_length=512,
                    truncation=True,
                    padding=True
                ).to(self.device)

                # Get embeddings
                outputs = self.model(**inputs, output_hidden_states=True)
                hidden_states = outputs.hidden_states[layer]

                # Use [CLS] token embedding
                computed_embeddings = hidden_states[:, 0, :].cpu().numpy()

                # Store in cache and update results
                for i, (text, embedding) in enumerate(zip(texts_to_compute, computed_embeddings)):
                    idx = indices_to_compute[i]
                    embeddings[idx] = embedding
                    self.feature_store.store_embedding(
                        text,
                        embedding.tolist(),
                        metadata={'layer': layer}
                    )

        return embeddings

    def precompute_batch(self, texts: List[str]):
        """
        Precompute and cache embeddings for a batch of texts.

        Args:
            texts: List of texts to precompute
        """
        logger.info(f"Precomputing embeddings for {len(texts)} texts")
        self.get_embeddings(texts)


def create_feature_store(
    max_cache_size: int = 10000,
    ttl_hours: int = 24,
    persist_path: Optional[str] = None
) -> FeatureStore:
    """
    Factory function to create feature store.

    Args:
        max_cache_size: Maximum cache size
        ttl_hours: Time-to-live in hours
        persist_path: Path for disk persistence

    Returns:
        FeatureStore instance
    """
    return FeatureStore(
        max_cache_size=max_cache_size,
        ttl_hours=ttl_hours,
        persist_path=persist_path
    )
