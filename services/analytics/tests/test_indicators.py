"""Tests for technical indicators"""
import pytest
from src.indicators import calculate_indicators, candles_to_dataframe
from src.models import OHLCVCandle


@pytest.fixture
def sample_candles():
    """Generate sample candles for testing"""
    candles = []
    base_price = 50000
    timestamp = 1234567890000

    for i in range(100):
        price = base_price + (i * 10)
        candles.append(
            OHLCVCandle(
                symbol="BTC/USDT",
                interval="1m",
                timestamp=timestamp + (i * 60000),
                open=price,
                high=price + 10,
                low=price - 10,
                close=price + 5,
                volume=100.0,
            )
        )

    return candles


def test_candles_to_dataframe(sample_candles):
    """Test conversion of candles to DataFrame"""
    df = candles_to_dataframe(sample_candles)

    assert len(df) == 100
    assert "timestamp" in df.columns
    assert "open" in df.columns
    assert "high" in df.columns
    assert "low" in df.columns
    assert "close" in df.columns
    assert "volume" in df.columns


def test_calculate_ema_20(sample_candles):
    """Test EMA(20) calculation"""
    results = calculate_indicators(sample_candles, ["ema_20"])

    assert len(results) == 100
    assert "ema_20" in results[0]

    # EMA should start as None until we have enough data
    assert results[0]["ema_20"] is None or isinstance(results[0]["ema_20"], float)

    # Later values should be calculated
    assert isinstance(results[50]["ema_20"], float)


def test_calculate_rsi_14(sample_candles):
    """Test RSI(14) calculation"""
    results = calculate_indicators(sample_candles, ["rsi_14"])

    assert len(results) == 100
    assert "rsi_14" in results[0]

    # RSI later values should be between 0 and 100
    if results[50]["rsi_14"] is not None:
        assert 0 <= results[50]["rsi_14"] <= 100


def test_calculate_multiple_indicators(sample_candles):
    """Test calculating multiple indicators at once"""
    results = calculate_indicators(sample_candles, ["ema_20", "ema_50", "rsi_14"])

    assert len(results) == 100
    assert "ema_20" in results[0]
    assert "ema_50" in results[0]
    assert "rsi_14" in results[0]


def test_calculate_with_empty_candles():
    """Test with empty candle list"""
    results = calculate_indicators([], ["ema_20"])
    assert results == []


def test_calculate_bollinger_bands(sample_candles):
    """Test Bollinger Bands calculation"""
    results = calculate_indicators(sample_candles, ["bollinger_bands"])

    assert len(results) == 100

    # Check if all three bands are present
    if results[50]["bb_upper"] is not None:
        assert "bb_upper" in results[50]
        assert "bb_middle" in results[50]
        assert "bb_lower" in results[50]

        # Upper should be > middle > lower
        assert results[50]["bb_upper"] > results[50]["bb_middle"]
        assert results[50]["bb_middle"] > results[50]["bb_lower"]
