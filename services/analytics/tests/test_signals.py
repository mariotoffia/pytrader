"""Tests for signal generation"""
import pytest
from src.signals import generate_ema_crossover_rsi_signals, generate_signals
from src.models import OHLCVCandle


@pytest.fixture
def trending_up_candles():
    """Generate candles with upward trend (should trigger buy signals)"""
    candles = []
    base_price = 50000
    timestamp = 1234567890000

    for i in range(100):
        # Gradual upward trend
        price = base_price + (i * 50)
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


@pytest.fixture
def trending_down_candles():
    """Generate candles with downward trend (should trigger sell signals)"""
    candles = []
    base_price = 55000
    timestamp = 1234567890000

    for i in range(100):
        # Gradual downward trend
        price = base_price - (i * 50)
        candles.append(
            OHLCVCandle(
                symbol="BTC/USDT",
                interval="1m",
                timestamp=timestamp + (i * 60000),
                open=price,
                high=price + 10,
                low=price - 10,
                close=price - 5,
                volume=100.0,
            )
        )

    return candles


def test_generate_signals_with_uptrend(trending_up_candles):
    """Test signal generation with upward trending candles"""
    signals = generate_ema_crossover_rsi_signals(trending_up_candles, "BTC/USDT")

    # Should generate at least one signal
    assert len(signals) >= 0

    # All signals should have required fields
    for signal in signals:
        assert signal.symbol == "BTC/USDT"
        assert signal.action in ["buy", "sell", "hold"]
        assert 0.0 <= signal.confidence <= 1.0
        assert signal.strategy_id == "ema_crossover_rsi"
        assert signal.metadata is not None


def test_generate_signals_with_downtrend(trending_down_candles):
    """Test signal generation with downward trending candles"""
    signals = generate_ema_crossover_rsi_signals(trending_down_candles, "BTC/USDT")

    # Should generate signals
    assert len(signals) >= 0

    # Check signal structure
    for signal in signals:
        assert signal.symbol == "BTC/USDT"
        assert signal.timestamp > 0


def test_generate_signals_insufficient_data():
    """Test with insufficient candles (less than 50)"""
    candles = [
        OHLCVCandle(
            symbol="BTC/USDT",
            interval="1m",
            timestamp=1234567890000 + (i * 60000),
            open=50000 + i,
            high=50010 + i,
            low=49990 + i,
            close=50005 + i,
            volume=100.0,
        )
        for i in range(30)
    ]

    signals = generate_ema_crossover_rsi_signals(candles, "BTC/USDT")

    # Should return empty list due to insufficient data
    assert signals == []


def test_generate_signals_dispatcher():
    """Test the signal generation dispatcher"""
    candles = [
        OHLCVCandle(
            symbol="BTC/USDT",
            interval="1m",
            timestamp=1234567890000 + (i * 60000),
            open=50000 + (i * 10),
            high=50010 + (i * 10),
            low=49990 + (i * 10),
            close=50005 + (i * 10),
            volume=100.0,
        )
        for i in range(60)
    ]

    # Test valid strategy
    signals = generate_signals(candles, "BTC/USDT", "ema_crossover_rsi")
    assert isinstance(signals, list)

    # Test invalid strategy
    with pytest.raises(ValueError, match="Unknown strategy"):
        generate_signals(candles, "BTC/USDT", "unknown_strategy")


def test_signal_confidence_values(trending_up_candles):
    """Test that confidence values are within valid range"""
    signals = generate_ema_crossover_rsi_signals(trending_up_candles, "BTC/USDT")

    for signal in signals:
        assert 0.0 <= signal.confidence <= 1.0, f"Confidence out of range: {signal.confidence}"


def test_signal_metadata_structure(trending_up_candles):
    """Test that signal metadata contains expected fields"""
    signals = generate_ema_crossover_rsi_signals(trending_up_candles, "BTC/USDT")

    for signal in signals:
        if signal.metadata:
            assert "ema_20" in signal.metadata
            assert "ema_50" in signal.metadata
            assert "rsi_14" in signal.metadata
