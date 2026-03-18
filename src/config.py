"""
Configuration module for TSW API polling
Handles API key loading, endpoint configuration, and settings
"""
import json
import os
from pathlib import Path
from typing import Dict, Any


class Config:
    """Configuration handler for the TSW API poller"""
    
    # Debug mode - set to True to see API calls and HTTP requests
    # Change this to True to enable console logging
    DEBUG = False
    
    # API connection settings
    API_HOST = "127.0.0.1"
    API_PORT = 31270
    API_PROTOCOL = "http"
    
    # Default timeouts (in seconds)
    REQUEST_TIMEOUT = 5
    CONNECTION_TIMEOUT = 3
    
    # API Key location - Release build
    API_KEY_RELEASE_PATH = Path.home() / "Documents" / "My Games" / "TrainSimWorld6" / "Saved" / "Config" / "CommAPIKey.txt"
    
    # API Key location - Development build
    API_KEY_DEV_PATH = None  # Will be detected if needed
    
    @staticmethod
    def load_api_key() -> str:
        """
        Load the API key from the CommAPIKey.txt file
        Checks release build location first, then development build
        
        Returns:
            str: The API key
            
        Raises:
            FileNotFoundError: If the API key file cannot be found
            ValueError: If the API key is empty
        """
        # Try release build location first
        if Config.API_KEY_RELEASE_PATH.exists():
            with open(Config.API_KEY_RELEASE_PATH, 'r', encoding='utf-8') as f:
                api_key = f.read().strip()
                if api_key:
                    if Config.DEBUG:

                        print(f"[Config] API Key loaded from: {Config.API_KEY_RELEASE_PATH}")
                    return api_key
                else:
                    raise ValueError("API key file is empty")
        
        raise FileNotFoundError(
            f"CommAPIKey.txt not found. Please ensure TSW6 is launched with -HTTPAPI parameter. "
            f"Expected location: {Config.API_KEY_RELEASE_PATH}"
        )
    
    @staticmethod
    def load_endpoints() -> Dict[str, Any]:
        """
        Load API endpoints configuration from api_endpoints.json
        
        Returns:
            dict: Configuration containing subscriptions, single_endpoints, and patch_endpoints
            
        Raises:
            FileNotFoundError: If api_endpoints.json is not found
            json.JSONDecodeError: If the JSON is malformed
        """
        config_path = Path(__file__).parent / "api_endpoints.json"
        
        if not config_path.exists():
            raise FileNotFoundError(f"api_endpoints.json not found at: {config_path}")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            endpoints_config = json.load(f)
        
        if Config.DEBUG:

        
            print(f"[Config] Endpoints configuration loaded from: {config_path}")
        return endpoints_config
    
    @staticmethod
    def get_api_url(endpoint: str = "") -> str:
        """
        Build a complete API URL
        
        Args:
            endpoint: The API endpoint (e.g., "/get/CurrentDrivableActor.Function.HUD_GetSpeed")
            
        Returns:
            str: Complete API URL
        """
        if not endpoint.startswith("/"):
            endpoint = "/" + endpoint
        return f"{Config.API_PROTOCOL}://{Config.API_HOST}:{Config.API_PORT}{endpoint}"
    
    @staticmethod
    def validate_config() -> bool:
        """
        Validate that all required configuration is available
        
        Returns:
            bool: True if config is valid
            
        Raises:
            Exception: If any required config is missing
        """
        try:
            api_key = Config.load_api_key()
            endpoints = Config.load_endpoints()
            
            if Config.DEBUG:

            
                print("[Config] Configuration validation passed")
            return True
        except Exception as e:
            if Config.DEBUG:

                print(f"[Config] Configuration validation failed: {e}")
            raise
