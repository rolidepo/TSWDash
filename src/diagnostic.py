"""
Diagnostic script to debug API responses
Run this after starting the game to see what the API actually returns
"""
import requests
import json
from config import Config

def main():
    """Run diagnostics"""
    print("\n" + "="*60)
    print("TSW API Diagnostic Tool")
    print("="*60 + "\n")
    
    try:
        # Load API key
        api_key = Config.load_api_key()
        headers = {"DTGCommKey": api_key}
        
        print("[Diagnostic] API Key loaded successfully\n")
        
        # Test 1: Single endpoint request
        print("[Test 1] Single endpoint: /get/CurrentDrivableActor.Function.HUD_GetSpeed")
        url = Config.get_api_url("/get/CurrentDrivableActor.Function.HUD_GetSpeed")
        
        response = requests.get(url, headers=headers, timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}\n")
        
        
        # Test 2: Create a subscription
        print("[Test 2] Create subscription 99 with a single endpoint")
        url = Config.get_api_url("/subscription/CurrentDrivableActor.Function.HUD_GetSpeed")
        params = {"Subscription": 99}
        
        response = requests.post(url, headers=headers, params=params, timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}\n")
        
        
        # Test 3: Poll the subscription
        print("[Test 3] Poll subscription 99")
        url = Config.get_api_url("/subscription")
        params = {"Subscription": 99}
        
        response = requests.get(url, headers=headers, params=params, timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}\n")
        
        
        # Test 4: Delete the subscription
        print("[Test 4] Delete subscription 99")
        url = Config.get_api_url("/subscription")
        params = {"Subscription": 99}
        
        response = requests.delete(url, headers=headers, params=params, timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}\n")
        
        
    except Exception as e:
        print(f"[Diagnostic] Error: {type(e).__name__}: {e}")
        print("\nMake sure TSW6 is running with -HTTPAPI parameter enabled")


if __name__ == "__main__":
    main()
