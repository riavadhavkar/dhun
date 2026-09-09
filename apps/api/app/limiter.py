"""Shared slowapi Limiter instance.

Lives in its own module (rather than being created in main.py) so router
modules can import it for `@limiter.limit(...)` decorators without a
circular import back to the app that mounts them.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])
