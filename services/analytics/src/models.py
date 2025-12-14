"""Pydantic models for analytics API"""
from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


# Type aliases
Interval = Literal["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]
IndicatorName = Literal["ema_20", "ema_50", "ema_200", "rsi_14", "macd", "bollinger_bands", "volume_sma"]
SignalAction = Literal["buy", "sell", "hold"]


class OHLCVCandle(BaseModel):
    """OHLCV candlestick data"""
    symbol: str
    interval: Interval
    timestamp: int
    open: float
    high: float
    low: float
    close: float
    volume: float


class CalculateIndicatorsRequest(BaseModel):
    """Request to calculate technical indicators"""
    model_config = ConfigDict(populate_by_name=True)

    provider: str
    symbol: str
    interval: Interval
    from_: int = Field(..., alias="from")
    to: int
    indicators: List[IndicatorName]


class IndicatorResult(BaseModel):
    """Single indicator result at a timestamp"""
    timestamp: int
    values: Dict[str, Optional[float]]


class CalculateIndicatorsResponse(BaseModel):
    """Response with calculated indicators"""
    results: List[IndicatorResult]


class GenerateSignalsRequest(BaseModel):
    """Request to generate trading signals"""
    model_config = ConfigDict(populate_by_name=True)

    provider: str
    symbol: str
    interval: Interval
    from_: int = Field(..., alias="from")
    to: int
    strategy_id: str


class Signal(BaseModel):
    """Trading signal"""
    symbol: str
    timestamp: int
    action: SignalAction
    confidence: float = Field(..., ge=0.0, le=1.0)
    price: float = Field(..., description="Price at which the signal was generated")
    strategy_id: str
    metadata: Optional[Dict[str, Any]] = None


class GenerateSignalsResponse(BaseModel):
    """Response with generated signals"""
    signals: List[Signal]


class HealthResponse(BaseModel):
    """Health check response"""
    status: Literal["ok", "degraded", "down"]
    service: str
    timestamp: int
    version: Optional[str] = None
    uptime: Optional[float] = None
