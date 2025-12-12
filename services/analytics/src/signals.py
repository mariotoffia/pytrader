"""Trading signal generation strategies"""
import pandas as pd
from typing import List
from .models import OHLCVCandle, Signal, SignalAction
from .indicators import candles_to_dataframe, calculate_ema, calculate_rsi


def generate_ema_crossover_rsi_signals(
    candles: List[OHLCVCandle], symbol: str, strategy_id: str = "ema_crossover_rsi"
) -> List[Signal]:
    """
    EMA Crossover + RSI Filter Strategy

    Buy Signal:  EMA(20) crosses above EMA(50) AND RSI(14) < 70
    Sell Signal: EMA(20) crosses below EMA(50) AND RSI(14) > 30
    Hold: All other conditions

    Returns a list of signals with timestamps and confidence scores
    """
    if len(candles) < 50:  # Need at least 50 candles for EMA(50)
        return []

    df = candles_to_dataframe(candles)

    # Calculate indicators
    ema_20 = calculate_ema(df, 20)
    ema_50 = calculate_ema(df, 50)
    rsi_14 = calculate_rsi(df, 14)

    # Add to dataframe
    df["ema_20"] = ema_20
    df["ema_50"] = ema_50
    df["rsi_14"] = rsi_14

    # Detect crossovers
    df["ema_diff"] = df["ema_20"] - df["ema_50"]
    df["ema_diff_prev"] = df["ema_diff"].shift(1)

    signals = []

    for i in range(1, len(df)):
        row = df.iloc[i]
        prev_row = df.iloc[i - 1]

        # Skip if any indicator is NaN
        if pd.isna(row["ema_20"]) or pd.isna(row["ema_50"]) or pd.isna(row["rsi_14"]):
            continue

        ema_diff = row["ema_diff"]
        ema_diff_prev = row["ema_diff_prev"]
        rsi = row["rsi_14"]

        action: SignalAction = "hold"
        confidence = 0.5  # Default confidence for hold

        # Bullish crossover: EMA(20) crosses above EMA(50)
        if ema_diff_prev <= 0 and ema_diff > 0:
            if rsi < 70:
                action = "buy"
                # Confidence based on RSI (lower RSI = higher confidence for buy)
                confidence = min(1.0, 0.5 + (70 - rsi) / 100)
            else:
                action = "hold"
                confidence = 0.3  # Weak signal, RSI too high

        # Bearish crossover: EMA(20) crosses below EMA(50)
        elif ema_diff_prev >= 0 and ema_diff < 0:
            if rsi > 30:
                action = "sell"
                # Confidence based on RSI (higher RSI = higher confidence for sell)
                confidence = min(1.0, 0.5 + (rsi - 30) / 100)
            else:
                action = "hold"
                confidence = 0.3  # Weak signal, RSI too low

        # Only emit buy/sell signals, skip holds
        if action != "hold":
            signal = Signal(
                symbol=symbol,
                timestamp=int(row["timestamp"]),
                action=action,
                confidence=confidence,
                price=float(row["close"]),
                strategy_id=strategy_id,
                metadata={
                    "ema_20": float(row["ema_20"]),
                    "ema_50": float(row["ema_50"]),
                    "rsi_14": float(rsi),
                },
            )
            signals.append(signal)

    return signals


def generate_signals(
    candles: List[OHLCVCandle], symbol: str, strategy_id: str
) -> List[Signal]:
    """
    Generate trading signals based on the specified strategy

    Supported strategies:
    - ema_crossover_rsi: EMA(20) vs EMA(50) crossover with RSI filter
    """
    if strategy_id == "ema_crossover_rsi":
        return generate_ema_crossover_rsi_signals(candles, symbol, strategy_id)
    else:
        raise ValueError(f"Unknown strategy: {strategy_id}")
