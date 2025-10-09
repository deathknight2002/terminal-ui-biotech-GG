# Test Suite

This directory contains unit and integration tests for the Biotech Terminal platform.

## Structure

```
tests/
├── logic/                  # Unit tests for business logic
│   └── test_valuation.py  # Valuation engine tests
├── integration/            # Integration tests
│   └── test_api_endpoints.py  # API endpoint tests
└── tui/                    # TUI component tests
    ├── test_recent_assets_tracker.py
    ├── test_risk_metrics.py
    └── test_watchlist_manager.py
```

## Running Tests

### All Tests
```bash
poetry run pytest
```

### Unit Tests Only
```bash
poetry run pytest tests/logic/
```

### Integration Tests Only
```bash
poetry run pytest tests/integration/
```

### With Coverage
```bash
poetry run pytest --cov=platform --cov-report=html
```

### Specific Test File
```bash
poetry run pytest tests/logic/test_valuation.py -v
```

### Specific Test Case
```bash
poetry run pytest tests/logic/test_valuation.py::TestValuationEngine::test_compute_revenue_projection_basic -v
```

## Test Categories

### Unit Tests (tests/logic/)

**test_valuation.py** - ValuationEngine tests (15 tests)
- Revenue projection calculations
- LoE erosion application
- DCF valuation
- Multiples valuation
- Sensitivity analysis
- Complete workflow
- Input hash validation

### Integration Tests (tests/integration/)

**test_api_endpoints.py** - API endpoint tests (30+ tests)
- Financial endpoints (price targets, consensus, valuation)
- Report generation (Excel, PowerPoint)
- LoE timeline
- Data upload
- Error handling

### TUI Tests (tests/tui/)

**test_recent_assets_tracker.py** - Recent assets tracking
**test_risk_metrics.py** - Risk metric calculations
**test_watchlist_manager.py** - Watchlist management

## Writing Tests

### Test Structure
```python
class TestMyFeature:
    """Test cases for MyFeature."""

    def setup_method(self):
        """Set up test fixtures."""
        self.feature = MyFeature()

    def test_basic_functionality(self):
        """Test basic functionality."""
        result = self.feature.do_something()
        assert result is not None
```

### Using Fixtures
```python
@pytest.fixture
def sample_data():
    """Provide sample data for tests."""
    return {
        "key": "value"
    }

def test_with_fixture(sample_data):
    """Test using fixture."""
    assert sample_data["key"] == "value"
```

### Async Tests
```python
@pytest.mark.asyncio
async def test_async_function():
    """Test async function."""
    result = await my_async_function()
    assert result is True
```

## Test Markers

Mark tests with categories:
```python
@pytest.mark.unit
def test_unit_logic():
    """Unit test."""
    pass

@pytest.mark.integration
def test_api_endpoint():
    """Integration test."""
    pass

@pytest.mark.slow
def test_slow_operation():
    """Slow test."""
    pass
```

Run specific markers:
```bash
pytest -m unit           # Run only unit tests
pytest -m integration    # Run only integration tests
pytest -m "not slow"     # Skip slow tests
```

## Test Database

Integration tests use a separate test database:
```python
TEST_DATABASE_URL = "sqlite:///./test.db"
```

The database is created and destroyed for each test module.

## Mocking

Use pytest-mock for mocking:
```python
def test_with_mock(mocker):
    """Test with mocked dependency."""
    mock_db = mocker.Mock()
    mock_db.query.return_value = []
    
    result = my_function(mock_db)
    assert result == expected_value
```

## Coverage

Target coverage: 80%+

Check coverage:
```bash
poetry run pytest --cov=platform --cov-report=term-missing
```

Generate HTML report:
```bash
poetry run pytest --cov=platform --cov-report=html
open htmlcov/index.html
```

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Scheduled nightly builds

## Best Practices

1. **Test one thing**: Each test should verify one behavior
2. **Use descriptive names**: Test names should describe what they test
3. **Arrange-Act-Assert**: Structure tests in three parts
4. **Don't repeat**: Use fixtures for common setup
5. **Test edge cases**: Include boundary conditions and error cases
6. **Keep tests fast**: Mock external dependencies
7. **Clean up**: Use fixtures for setup/teardown
8. **Document**: Add docstrings to test classes and methods

## Common Patterns

### Testing Exceptions
```python
def test_raises_error():
    """Test that error is raised."""
    with pytest.raises(ValueError):
        my_function(invalid_input)
```

### Parametrized Tests
```python
@pytest.mark.parametrize("input,expected", [
    (1, 2),
    (2, 4),
    (3, 6),
])
def test_double(input, expected):
    """Test doubling values."""
    assert double(input) == expected
```

### Testing API Endpoints
```python
def test_get_endpoint():
    """Test GET endpoint."""
    response = client.get("/api/v1/resource")
    assert response.status_code == 200
    data = response.json()
    assert "key" in data
```

## Troubleshooting

### Import Errors
Ensure Python path is set:
```bash
export PYTHONPATH=/path/to/terminal-ui-biotech-GG
```

### Database Errors
Clean test database:
```bash
rm test.db
```

### Async Errors
Install pytest-asyncio:
```bash
poetry add --dev pytest-asyncio
```

### Coverage Not Working
Install coverage:
```bash
poetry add --dev pytest-cov
```

## Related Documentation

- [Development Guide](../docs/DEVELOPMENT.md)
- [API Integration](../docs/API_INTEGRATION.md)
- [Architecture Overview](../docs/ARCHITECTURE_OVERVIEW.md)
