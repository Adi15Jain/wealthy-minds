import httpx
from datetime import datetime, timezone
import base64
import json
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class GrowwClient:
    """
    A client for the Groww API that handles token lifecycle and static IP proxy routing.
    """
    def __init__(self):
        # Configure httpx client with a proxy if a STATIC_IP_PROXY is provided in the environment.
        # This solves the SEBI Static IP compliance by routing all outbound Groww requests 
        # through a consistent, whitelisted IP address.
        proxy = None
        if hasattr(settings, "STATIC_IP_PROXY") and settings.STATIC_IP_PROXY:
            proxy = settings.STATIC_IP_PROXY
            logger.info("Configured Groww client to route through static IP proxy.")

        self.client = httpx.AsyncClient(proxy=proxy, timeout=10.0)
        self.api_key = settings.GROWW_API_KEY
        self.api_secret = settings.GROWW_API_SECRET

    def _is_token_expired(self) -> bool:
        """
        Decodes the JWT API key to check if it has passed its expiration time.
        """
        if not self.api_key:
            return True
            
        try:
            # JWTs have 3 parts: header, payload, signature. We need the payload.
            parts = self.api_key.split('.')
            if len(parts) != 3:
                return True
                
            payload_base64 = parts[1]
            # Add padding if necessary
            payload_base64 += '=' * (-len(payload_base64) % 4)
            payload_json = base64.b64decode(payload_base64).decode('utf-8')
            payload = json.loads(payload_json)
            
            exp_timestamp = payload.get("exp")
            if not exp_timestamp:
                return True
                
            # Check if current UTC time is past the expiration timestamp
            current_time = datetime.now(timezone.utc).timestamp()
            # Adding a 5-minute buffer to proactively refresh before it actually fails
            return current_time > (exp_timestamp - 300)
            
        except Exception as e:
            logger.warning(f"Failed to parse token expiration: {e}")
            return True

    async def _refresh_token(self) -> bool:
        """
        Stub for token refresh logic. 
        In a production scenario, this would use the API Secret or a refresh token 
        to hit the authentication endpoint and retrieve a new session token.
        """
        logger.info("Attempting to refresh Groww API token...")
        
        # TODO: Implement actual Groww OAuth/TOTP token refresh API call here.
        # Example:
        # response = await self.client.post(
        #     "https://api.groww.in/v1/auth/refresh",
        #     json={"secret": self.api_secret}
        # )
        # if response.status_code == 200:
        #     self.api_key = response.json().get("access_token")
        #     return True
        
        logger.error("Token refresh mechanism requires concrete Groww authentication endpoints.")
        return False

    async def get_headers(self) -> dict:
        """
        Returns authenticated headers, proactively refreshing the token if needed.
        """
        if self._is_token_expired():
            success = await self._refresh_token()
            if not success:
                raise Exception("Groww API token is expired and could not be refreshed. Requires manual re-authentication.")
                
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def fetch_portfolio(self):
        """Example method to fetch portfolio data."""
        headers = await self.get_headers()
        # Make the request to Groww API using self.client
        # response = await self.client.get("https://api.groww.in/...", headers=headers)
        # return response.json()
        pass

groww_client = GrowwClient()
