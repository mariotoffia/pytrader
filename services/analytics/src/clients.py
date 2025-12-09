"""HTTP client for Market Data Service"""
import httpx
from typing import List
from .models import OHLCVCandle, Interval


class MarketDataClient:
    """Client for fetching candle data from Market Data Service"""

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_candles(
        self, symbol: str, interval: Interval, from_ts: int, to_ts: int
    ) -> List[OHLCVCandle]:
        """Fetch historical candles"""
        params = {
            "symbol": symbol,
            "interval": interval,
            "from": from_ts,
            "to": to_ts,
        }

        url = f"{self.base_url}/internal/candles"
        response = await self.client.get(url, params=params)
        response.raise_for_status()

        data = response.json()
        return [OHLCVCandle(**candle) for candle in data["candles"]]

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
