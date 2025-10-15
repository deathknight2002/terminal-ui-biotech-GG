"""
Tests for Feature Store Module
"""

import pytest
import tempfile
import os
from datetime import datetime, timedelta
from ml.optimization.feature_store import FeatureStore, EmbeddingCache, create_feature_store


class TestFeatureStore:
    """Test feature store functionality."""
    
    def test_initialization(self):
        """Test feature store initialization."""
        store = FeatureStore(max_cache_size=100, ttl_hours=12)
        
        assert store.max_cache_size == 100
        assert store.ttl_hours == 12
        assert store.hits == 0
        assert store.misses == 0
    
    def test_compute_hash(self):
        """Test hash computation."""
        store = FeatureStore()
        
        hash1 = store._compute_hash("test text")
        hash2 = store._compute_hash("test text")
        hash3 = store._compute_hash("different text")
        
        assert hash1 == hash2
        assert hash1 != hash3
    
    def test_store_and_retrieve_embedding(self):
        """Test storing and retrieving embeddings."""
        store = FeatureStore()
        
        text = "test text"
        embedding = [0.1, 0.2, 0.3]
        metadata = {"layer": -1}
        
        store.store_embedding(text, embedding, metadata)
        
        result = store.get_embedding(text)
        
        assert result is not None
        assert result['embedding'] == embedding
        assert result['metadata'] == metadata
        assert store.hits == 1
        assert store.misses == 0
    
    def test_cache_miss(self):
        """Test cache miss."""
        store = FeatureStore()
        
        result = store.get_embedding("nonexistent text")
        
        assert result is None
        assert store.misses == 1
        assert store.hits == 0
    
    def test_ttl_expiration(self):
        """Test TTL expiration."""
        store = FeatureStore(ttl_hours=0)  # Immediate expiration
        
        text = "test text"
        embedding = [0.1, 0.2, 0.3]
        
        store.store_embedding(text, embedding)
        
        # Simulate time passing
        key = store._compute_hash(text)
        store._access_times[key] = datetime.now() - timedelta(hours=1)
        
        result = store.get_embedding(text)
        
        assert result is None
        assert store.misses == 1
    
    def test_lru_eviction(self):
        """Test LRU eviction."""
        store = FeatureStore(max_cache_size=2)
        
        # Fill cache
        store.store_embedding("text1", [0.1])
        store.store_embedding("text2", [0.2])
        
        # Access text1 to make it more recent
        store.get_embedding("text1")
        
        # Add third item (should evict text2)
        store.store_embedding("text3", [0.3])
        
        # text2 should be evicted
        assert store.get_embedding("text2") is None
        # text1 and text3 should still be present
        assert store.get_embedding("text1") is not None
        assert store.get_embedding("text3") is not None
    
    def test_batch_operations(self):
        """Test batch get and store operations."""
        store = FeatureStore()
        
        texts = ["text1", "text2", "text3"]
        embeddings = [[0.1], [0.2], [0.3]]
        
        store.batch_store(texts, embeddings)
        
        results = store.batch_get(texts)
        
        assert len(results) == 3
        assert all(results[text] is not None for text in texts)
    
    def test_clear_cache(self):
        """Test clearing cache."""
        store = FeatureStore()
        
        store.store_embedding("text1", [0.1])
        store.store_embedding("text2", [0.2])
        
        assert len(store._cache) == 2
        
        store.clear()
        
        assert len(store._cache) == 0
        assert store.hits == 0
        assert store.misses == 0
    
    def test_get_stats(self):
        """Test getting statistics."""
        store = FeatureStore(max_cache_size=10)
        
        store.store_embedding("text1", [0.1])
        store.get_embedding("text1")
        store.get_embedding("text2")
        
        stats = store.get_stats()
        
        assert stats['size'] == 1
        assert stats['max_size'] == 10
        assert stats['hits'] == 1
        assert stats['misses'] == 1
        assert stats['hit_rate'] == 0.5
    
    def test_persistence(self):
        """Test disk persistence."""
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pkl') as tmp:
            persist_path = tmp.name
        
        try:
            # Create store with persistence
            store1 = FeatureStore(persist_path=persist_path)
            store1.store_embedding("text1", [0.1], {"test": "metadata"})
            store1._persist_to_disk()
            
            # Create new store and load from disk
            store2 = FeatureStore(persist_path=persist_path)
            
            result = store2.get_embedding("text1")
            
            assert result is not None
            assert result['embedding'] == [0.1]
            assert result['metadata'] == {"test": "metadata"}
        finally:
            if os.path.exists(persist_path):
                os.unlink(persist_path)
    
    def test_factory_function(self):
        """Test factory function."""
        store = create_feature_store(max_cache_size=200, ttl_hours=48)
        
        assert isinstance(store, FeatureStore)
        assert store.max_cache_size == 200
        assert store.ttl_hours == 48


class TestEmbeddingCache:
    """Test embedding cache functionality."""
    
    def test_initialization(self):
        """Test embedding cache initialization."""
        from unittest.mock import Mock
        
        mock_store = Mock()
        mock_model = Mock()
        mock_tokenizer = Mock()
        
        cache = EmbeddingCache(
            feature_store=mock_store,
            model=mock_model,
            tokenizer=mock_tokenizer,
            device="cpu"
        )
        
        assert cache.feature_store == mock_store
        assert cache.model == mock_model
        assert cache.tokenizer == mock_tokenizer
        assert cache.device == "cpu"
    
    def test_get_embeddings_from_cache(self):
        """Test retrieving embeddings from cache."""
        from unittest.mock import Mock
        
        mock_store = Mock()
        mock_store.get_embedding.return_value = {
            'embedding': [0.1, 0.2, 0.3]
        }
        
        cache = EmbeddingCache(
            feature_store=mock_store,
            model=Mock(),
            tokenizer=Mock(),
            device="cpu"
        )
        
        texts = ["cached text"]
        embeddings = cache.get_embeddings(texts)
        
        assert len(embeddings) == 1
        assert embeddings[0] == [0.1, 0.2, 0.3]
    
    def test_precompute_batch(self):
        """Test precomputing embeddings."""
        from unittest.mock import Mock, patch
        
        mock_store = Mock()
        mock_store.get_embedding.return_value = None
        
        mock_model = Mock()
        mock_tokenizer = Mock()
        
        cache = EmbeddingCache(
            feature_store=mock_store,
            model=mock_model,
            tokenizer=mock_tokenizer,
            device="cpu"
        )
        
        texts = ["text1", "text2"]
        
        # Mock the get_embeddings method to avoid complex torch mocking
        with patch.object(cache, 'get_embeddings', return_value=[[0.1], [0.2]]):
            cache.precompute_batch(texts)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
