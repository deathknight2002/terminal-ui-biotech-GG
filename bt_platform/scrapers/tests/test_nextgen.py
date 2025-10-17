"""
Tests for next-gen ingestion features
"""

import pytest
from datetime import datetime, timedelta
from bt_platform.scrapers.utils import (
    PriorityQueue,
    Priority,
    CSVDropZone,
    PriceRecord,
    PriceDataValidator,
    PDFIntelligence,
    SelfHealingParser,
)


class TestPriorityQueue:
    """Tests for priority queue"""
    
    def test_queue_creation(self):
        """Test creating a priority queue"""
        queue = PriorityQueue()
        assert queue is not None
        assert queue.is_empty()
        assert queue.size() == 0
    
    def test_add_item(self):
        """Test adding items to queue"""
        queue = PriorityQueue()
        
        queue.add('https://example.com', 'test', Priority.NEWS_TIER1)
        
        assert not queue.is_empty()
        assert queue.size() == 1
    
    def test_priority_order(self):
        """Test that items are dequeued by priority"""
        queue = PriorityQueue()
        
        # Add items in reverse priority order
        queue.add('https://example.com/news', 'news', Priority.NEWS_TIER2)
        queue.add('https://example.com/fda', 'fda', Priority.REGULATOR)
        queue.add('https://example.com/ir', 'ir', Priority.IR_PAGE)
        
        # Should get IR page first (highest priority)
        items = []
        while not queue.is_empty():
            item = queue.queue[0]  # Peek
            items.append((item.priority, item.url))
            queue.queue.pop(0)  # Remove manually for testing
        
        # Check priorities are in order
        assert items[0][0] == Priority.IR_PAGE.value
        assert items[1][0] == Priority.REGULATOR.value
        assert items[2][0] == Priority.NEWS_TIER2.value
    
    def test_auto_priority_detection(self):
        """Test automatic priority detection from source"""
        queue = PriorityQueue()
        
        queue.add('https://www.fda.gov/news', 'fda')
        
        assert queue.size() == 1
        item = queue.queue[0]
        assert item.priority == Priority.REGULATOR.value
    
    def test_stats_tracking(self):
        """Test statistics tracking"""
        queue = PriorityQueue()
        
        queue.add('https://example.com/1', 'test')
        queue.add('https://example.com/2', 'test')
        
        stats = queue.get_stats()
        assert stats['queued'] == 2
        assert stats['queue_size'] == 2


class TestCSVDropZone:
    """Tests for CSV drop zone"""
    
    def test_parse_csv_basic(self):
        """Test parsing basic CSV"""
        csv_content = """date,ticker,close
2024-01-15,BLUE,45.50
2024-01-16,BLUE,46.20
2024-01-17,BLUE,47.10"""
        
        drop_zone = CSVDropZone()
        records = drop_zone.parse_csv(csv_content, ticker='BLUE')
        
        assert len(records) == 3
        assert records[0].ticker == 'BLUE'
        assert records[0].close == 45.50
    
    def test_parse_csv_with_ohlcv(self):
        """Test parsing CSV with OHLCV data"""
        csv_content = """date,ticker,open,high,low,close,volume
2024-01-15,BLUE,45.00,46.00,44.50,45.50,1000000
2024-01-16,BLUE,45.50,47.00,45.00,46.20,1200000"""
        
        drop_zone = CSVDropZone()
        records = drop_zone.parse_csv(csv_content)
        
        assert len(records) == 2
        assert records[0].open == 45.00
        assert records[0].high == 46.00
        assert records[0].low == 44.50
        assert records[0].close == 45.50
        assert records[0].volume == 1000000
    
    def test_column_detection(self):
        """Test automatic column detection"""
        # Test Yahoo Finance format
        csv_content = """Date,Open,High,Low,Close,Adj Close,Volume
2024-01-15,45.00,46.00,44.50,45.50,45.50,1000000"""
        
        drop_zone = CSVDropZone()
        records = drop_zone.parse_csv(csv_content, ticker='BLUE')
        
        assert len(records) == 1
        assert records[0].adj_close == 45.50
    
    def test_validation(self):
        """Test price data validation"""
        records = [
            PriceRecord(
                ticker='BLUE',
                date=datetime(2024, 1, 15),
                open=45.00,
                high=46.00,
                low=44.50,
                close=45.50,
            )
        ]
        
        validator = PriceDataValidator()
        result = validator.validate_records(records)
        
        assert result['total_records'] == 1
        assert result['valid'] is True
    
    def test_validation_invalid_prices(self):
        """Test validation catches invalid prices"""
        records = [
            PriceRecord(
                ticker='BLUE',
                date=datetime(2024, 1, 15),
                open=45.00,
                high=44.00,  # High < Low (invalid)
                low=46.00,
                close=45.50,
            )
        ]
        
        validator = PriceDataValidator()
        result = validator.validate_records(records)
        
        assert result['issues']['invalid_prices'] > 0
        assert result['valid'] is False


class TestPDFIntelligence:
    """Tests for PDF intelligence"""
    
    def test_trial_id_extraction(self):
        """Test extracting clinical trial IDs"""
        text = """
        This study (NCT12345678) is a Phase II trial evaluating the safety
        and efficacy of Drug X. See also NCT87654321 for related data.
        """
        
        intelligence = PDFIntelligence()
        data = intelligence.extract_from_text(text)
        
        assert len(data.trial_ids) == 2
        assert 'NCT12345678' in data.trial_ids
        assert 'NCT87654321' in data.trial_ids
    
    def test_phase_extraction(self):
        """Test extracting trial phases"""
        text = """
        This is a Phase II/III clinical trial evaluating overall survival.
        Previous Phase I trials showed acceptable safety profiles.
        """
        
        intelligence = PDFIntelligence()
        data = intelligence.extract_from_text(text)
        
        assert len(data.phases) >= 1
        assert any('Phase II' in p or 'Phase I' in p for p in data.phases)
    
    def test_endpoint_extraction(self):
        """Test extracting clinical endpoints"""
        text = """
        The primary endpoint is overall survival (OS). Secondary endpoints
        include progression-free survival (PFS) and objective response rate.
        """
        
        intelligence = PDFIntelligence()
        data = intelligence.extract_from_text(text)
        
        assert len(data.endpoints) > 0
    
    def test_indication_extraction(self):
        """Test extracting indications"""
        text = """
        Treatment for advanced melanoma and non-small cell lung cancer (NSCLC).
        """
        
        intelligence = PDFIntelligence()
        data = intelligence.extract_from_text(text)
        
        assert len(data.indications) > 0
        assert any('melanoma' in i.lower() for i in data.indications)
    
    def test_success_rate_calculation(self):
        """Test success rate calculation"""
        # Text with minimal data
        text = "NCT12345678"
        
        intelligence = PDFIntelligence()
        data = intelligence.extract_from_text(text)
        
        # Should have low success rate (only trial ID)
        assert data.success_rate < 100
        assert data.success_rate >= 0


class TestSelfHealingParser:
    """Tests for self-healing parser"""
    
    @pytest.mark.asyncio
    async def test_structured_data_parsing(self):
        """Test parsing with structured data"""
        html = """
        <html>
        <head>
            <script type="application/ld+json">
            {
                "@type": "NewsArticle",
                "headline": "Test Article",
                "description": "Test description",
                "datePublished": "2024-01-15"
            }
            </script>
        </head>
        <body></body>
        </html>
        """
        
        parser = SelfHealingParser()
        result = await parser.parse(html, 'test')
        
        assert result is not None
        assert result['title'] == 'Test Article'
        assert result['parse_method'] == 'structured_data'
    
    @pytest.mark.asyncio
    async def test_readability_fallback(self):
        """Test readability fallback"""
        html = """
        <html>
        <head><title>Test Page</title></head>
        <body>
            <article>
                <h1>Test Article</h1>
                <p>This is the main content of the article.</p>
            </article>
        </body>
        </html>
        """
        
        parser = SelfHealingParser()
        result = await parser.parse(html, 'test')
        
        assert result is not None
        assert 'Test Article' in result.get('title', '') or 'Test Article' in result.get('content', '')
    
    def test_health_tracking(self):
        """Test health dashboard tracking"""
        parser = SelfHealingParser()
        
        # Initially empty
        dashboard = parser.get_health_dashboard()
        assert len(dashboard) == 0
        
        # Would populate after actual parsing in integration tests
    
    def test_custom_selectors(self):
        """Test registering custom selectors"""
        parser = SelfHealingParser()
        
        parser.register_selectors('test_source', {
            'title': 'h1.title',
            'content': 'div.content',
        })
        
        assert 'test_source' in parser.custom_selectors
        assert parser.custom_selectors['test_source']['title'] == 'h1.title'


class TestIntegration:
    """Integration tests"""
    
    def test_stats_tracking(self):
        """Test that all components track stats"""
        queue = PriorityQueue()
        queue.add('https://example.com', 'test')
        
        stats = queue.get_stats()
        assert 'queued' in stats
        assert 'queue_size' in stats
        
        drop_zone = CSVDropZone()
        stats = drop_zone.get_stats()
        assert 'files_processed' in stats
        assert 'records_imported' in stats


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
