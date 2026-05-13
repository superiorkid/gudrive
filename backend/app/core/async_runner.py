import asyncio
from typing import Any, Coroutine

_loop = None


def get_loop():
    global _loop
    if _loop is None:
        _loop = asyncio.new_event_loop()
        asyncio.set_event_loop(_loop)
    return _loop


def run_async(coro: Coroutine[Any, Any, Any]):
    loop = get_loop()
    return loop.run_until_complete(coro)
