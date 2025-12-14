"""Indicators API router"""
import logging
from fastapi import APIRouter, HTTPException, Request
from ..models import CalculateIndicatorsRequest, CalculateIndicatorsResponse, IndicatorResult
from ..clients import MarketDataClient
from ..indicators import calculate_indicators
from ..config import config

router = APIRouter()
market_data_client = MarketDataClient(config.MARKET_DATA_URL)
logger = logging.getLogger(__name__)


@router.post("/internal/indicators", response_model=CalculateIndicatorsResponse)
async def calculate_indicators_endpoint(payload: CalculateIndicatorsRequest, request: Request):
    """Calculate technical indicators for the specified time range"""
    request_id = getattr(request.state, "request_id", None)
    try:
        logger.info(
            f"[{request_id}] calculate_indicators provider={payload.provider} symbol={payload.symbol} "
            f"interval={payload.interval} from={payload.from_} to={payload.to} indicators={payload.indicators}"
        )
        # Fetch candles from market-data service
        candles = await market_data_client.get_candles(
            provider=payload.provider,
            symbol=payload.symbol,
            interval=payload.interval,
            from_ts=payload.from_,
            to_ts=payload.to,
        )

        if not candles:
            return CalculateIndicatorsResponse(results=[])

        # Calculate indicators
        indicator_data = calculate_indicators(candles, payload.indicators)

        # Convert to response format
        results = [
            IndicatorResult(timestamp=item["timestamp"], values={k: v for k, v in item.items() if k != "timestamp"})
            for item in indicator_data
        ]

        return CalculateIndicatorsResponse(results=results)

    except Exception as e:
        logger.exception(f"[{request_id}] calculate_indicators failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
