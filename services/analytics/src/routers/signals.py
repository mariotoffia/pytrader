"""Signals API router"""
import logging
from fastapi import APIRouter, HTTPException, Request
from ..models import GenerateSignalsRequest, GenerateSignalsResponse
from ..clients import MarketDataClient
from ..signals import generate_signals
from ..config import config

router = APIRouter()
market_data_client = MarketDataClient(config.MARKET_DATA_URL)
logger = logging.getLogger(__name__)


@router.post("/internal/signals", response_model=GenerateSignalsResponse)
async def generate_signals_endpoint(payload: GenerateSignalsRequest, request: Request):
    """Generate trading signals based on the specified strategy"""
    request_id = getattr(request.state, "request_id", None)
    try:
        logger.info(
            f"[{request_id}] generate_signals provider={payload.provider} symbol={payload.symbol} "
            f"interval={payload.interval} from={payload.from_} to={payload.to} strategy_id={payload.strategy_id}"
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
            return GenerateSignalsResponse(signals=[])

        # Generate signals
        signals = generate_signals(candles, payload.symbol, payload.strategy_id)

        return GenerateSignalsResponse(signals=signals)

    except ValueError as e:
        logger.warning(f"[{request_id}] generate_signals bad request: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"[{request_id}] generate_signals failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
