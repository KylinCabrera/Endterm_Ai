import json
import os
import time
from functools import lru_cache
from urllib.parse import urlparse
from urllib.request import urlopen

from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError

load_dotenv()

security = HTTPBearer(auto_error=False)


@lru_cache(maxsize=2)
def get_public_keys(issuer: str, time_bucket: int):
    """Cache Clerk's public verification keys for up to five minutes."""
    url = f"{issuer}/.well-known/jwks.json"

    with urlopen(url, timeout=10) as response:
        return json.load(response)


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    issuer = os.getenv("CLERK_ISSUER_URL", "").strip().rstrip("/")

    allowed_origins = [
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_URL",
            "http://localhost:5173",
        ).split(",")
        if origin.strip()
    ]

    parsed = urlparse(issuer)

    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.path
        or parsed.query
        or parsed.fragment
    ):
        raise HTTPException(
            status_code=503,
            detail="CLERK_ISSUER_URL is missing or invalid on the backend.",
        )

    try:
        public_keys = get_public_keys(
            issuer,
            int(time.time() // 300),
        )
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Cannot reach Clerk to verify your session. Try again.",
        )

    try:
        token = credentials.credentials
        header = jwt.get_unverified_header(token)

        signing_key = next(
            (
                key
                for key in public_keys.get("keys", [])
                if key.get("kid") == header.get("kid")
            ),
            None,
        )

        if signing_key is None:
            raise JWTError("Unknown signing key")

        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=issuer,
            options={
                "verify_aud": False,
                "require_exp": True,
                "require_iat": True,
                "require_sub": True,
            },
        )

        # Accept browser sessions only from your configured frontend.
        if claims.get("azp") not in allowed_origins:
            raise JWTError("Frontend origin is not allowed")

        user_id = claims.get("sub")

        if not isinstance(user_id, str) or not user_id:
            raise JWTError("Missing user ID")

        return user_id

    except (JWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )