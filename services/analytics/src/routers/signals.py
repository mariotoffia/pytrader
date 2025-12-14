"""Signals API router"""
from fastapi import APIRouter, HTTPException
from ..models import GenerateSignalsRequest, GenerateSignalsResponse
from ..clients import MarketDataClient
from ..signals import generate_signals
from ..config import config

router = APIRouter()
market_data_client = MarketDataClient(config.MARKET_DATA_URL)


@router.post("/internal/signals", response_model=GenerateSignalsResponse)
async def generate_signals_endpoint(request: GenerateSignalsRequest):
    """Generate trading signals based on the specified strategy"""
    try:
        # Fetch candles from market-data service
        candles = await market_data_client.get_candles(
            provider=request.provider,
            symbol=request.symbol,
            interval=request.interval,
            from_ts=request.from_,
            to_ts=request.to,
        )

        if not candles:
            return GenerateSignalsResponse(signals=[])

        # Generate signals
        signals = generate_signals(candles, request.symbol, request.strategy_id)

        return GenerateSignalsResponse(signals=signals)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
