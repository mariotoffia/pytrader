"""Indicators API router"""
from fastapi import APIRouter, HTTPException
from ..models import CalculateIndicatorsRequest, CalculateIndicatorsResponse, IndicatorResult
from ..clients import MarketDataClient
from ..indicators import calculate_indicators
from ..config import config

router = APIRouter()
market_data_client = MarketDataClient(config.MARKET_DATA_URL)


@router.post("/internal/indicators", response_model=CalculateIndicatorsResponse)
async def calculate_indicators_endpoint(request: CalculateIndicatorsRequest):
    """Calculate technical indicators for the specified time range"""
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
            return CalculateIndicatorsResponse(results=[])

        # Calculate indicators
        indicator_data = calculate_indicators(candles, request.indicators)

        # Convert to response format
        results = [
            IndicatorResult(timestamp=item["timestamp"], values={k: v for k, v in item.items() if k != "timestamp"})
            for item in indicator_data
        ]

        return CalculateIndicatorsResponse(results=results)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
