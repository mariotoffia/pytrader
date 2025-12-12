"""Configuration management for analytics service"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Analytics service configuration"""

    PORT: int = int(os.getenv("PORT", "4002"))
    MARKET_DATA_URL: str = os.getenv("MARKET_DATA_URL", "http://localhost:4001")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")


config = Config()
