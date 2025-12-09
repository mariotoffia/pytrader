"""Technical indicator calculations using pandas and ta library"""
import pandas as pd
import numpy as np
from ta.trend import EMAIndicator
from ta.momentum import RSIIndicator
from ta.volatility import BollingerBands
from ta.volume import VolumeWeightedAveragePrice
from typing import List, Dict, Optional
from .models import OHLCVCandle, IndicatorName


def candles_to_dataframe(candles: List[OHLCVCandle]) -> pd.DataFrame:
    """Convert list of candles to pandas DataFrame"""
    if not candles:
        return pd.DataFrame()

    data = {
        "timestamp": [c.timestamp for c in candles],
        "open": [c.open for c in candles],
        "high": [c.high for c in candles],
        "low": [c.low for c in candles],
        "close": [c.close for c in candles],
        "volume": [c.volume for c in candles],
    }

    df = pd.DataFrame(data)
    df = df.sort_values("timestamp")
    return df


def calculate_ema(df: pd.DataFrame, period: int) -> pd.Series:
    """Calculate Exponential Moving Average"""
    ema = EMAIndicator(close=df["close"], window=period)
    return ema.ema_indicator()


def calculate_rsi(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Calculate Relative Strength Index"""
    rsi = RSIIndicator(close=df["close"], window=period)
    return rsi.rsi()


def calculate_bollinger_bands(df: pd.DataFrame, period: int = 20, std_dev: int = 2) -> Dict[str, pd.Series]:
    """Calculate Bollinger Bands"""
    bb = BollingerBands(close=df["close"], window=period, window_dev=std_dev)
    return {
        "bb_upper": bb.bollinger_hband(),
        "bb_middle": bb.bollinger_mavg(),
        "bb_lower": bb.bollinger_lband(),
    }


def calculate_volume_sma(df: pd.DataFrame, period: int = 20) -> pd.Series:
    """Calculate Simple Moving Average of volume"""
    return df["volume"].rolling(window=period).mean()


def calculate_indicators(
    candles: List[OHLCVCandle], indicator_names: List[IndicatorName]
) -> List[Dict[str, Optional[float]]]:
    """
    Calculate requested technical indicators

    Returns a list of dicts, one per candle timestamp, with indicator values
    """
    if not candles:
        return []

    df = candles_to_dataframe(candles)
    results = []

    # Initialize result structure
    for _, row in df.iterrows():
        result = {"timestamp": int(row["timestamp"])}
        results.append(result)

    # Calculate each requested indicator
    for indicator_name in indicator_names:
        if indicator_name == "ema_20":
            values = calculate_ema(df, 20)
            for i, val in enumerate(values):
                results[i]["ema_20"] = float(val) if not pd.isna(val) else None

        elif indicator_name == "ema_50":
            values = calculate_ema(df, 50)
            for i, val in enumerate(values):
                results[i]["ema_50"] = float(val) if not pd.isna(val) else None

        elif indicator_name == "ema_200":
            values = calculate_ema(df, 200)
            for i, val in enumerate(values):
                results[i]["ema_200"] = float(val) if not pd.isna(val) else None

        elif indicator_name == "rsi_14":
            values = calculate_rsi(df, 14)
            for i, val in enumerate(values):
                results[i]["rsi_14"] = float(val) if not pd.isna(val) else None

        elif indicator_name == "bollinger_bands":
            bb = calculate_bollinger_bands(df)
            for i in range(len(df)):
                results[i]["bb_upper"] = float(bb["bb_upper"].iloc[i]) if not pd.isna(bb["bb_upper"].iloc[i]) else None
                results[i]["bb_middle"] = float(bb["bb_middle"].iloc[i]) if not pd.isna(bb["bb_middle"].iloc[i]) else None
                results[i]["bb_lower"] = float(bb["bb_lower"].iloc[i]) if not pd.isna(bb["bb_lower"].iloc[i]) else None

        elif indicator_name == "volume_sma":
            values = calculate_volume_sma(df)
            for i, val in enumerate(values):
                results[i]["volume_sma"] = float(val) if not pd.isna(val) else None

    return results
