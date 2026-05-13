import datetime

from sqlalchemy import DateTime
from sqlalchemy.ext.asyncio import AsyncAttrs, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_configs

config = get_configs()

DATABASE_URL: str = config.database_url


class Base(AsyncAttrs, DeclarativeBase):
    """Base class for all models"""

    type_annotation_map = {datetime.datetime: DateTime(timezone=True)}


engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,  # Keep 20 connections ready
    max_overflow=40,  # Allow 40 more during spikes
    pool_timeout=30,  # Wait 30s for connection
    pool_recycle=3600,  # Recycle every hour
    pool_pre_ping=True,  # Test connection before use
    echo=False,  # Don't log SQL in production
)

async_session_maker = async_sessionmaker(engine, expire_on_commit=False)
