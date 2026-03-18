"""
API Field Discovery Script
Helps identify the actual field names returned by the game API
Run this to see what fields are available for each endpoint
"""
import requests
import json
from config import Config

def discover_fields():
    """Discover all field names in the API responses"""
    print("\n" + "="*70)
    print("TSW API Field Discovery Tool")
    print("="*70 + "\n")
    
    try:
        api_key = Config.load_api_key()
        headers = {"DTGCommKey": api_key}
        
        # Test endpoints to discover
        test_endpoints = [
            "CurrentDrivableActor.Function.HUD_GetSpeed",
            "CurrentDrivableActor.Function.HUD_GetRPM",
            "CurrentDrivableActor.Function.HUD_GetBrakeGauge_1",
            "CurrentDrivableActor.Function.HUD_GetBrakeGauge_2",
            "CurrentDrivableActor.Function.HUD_GetAmmeter",
            "CurrentDrivableActor.Function.HUD_GetVoltmeter",
            "WeatherManager.Temperature",
            "WeatherManager.Cloudiness",
            "WeatherManager.Precipitation",
        ]
        
        print("Testing Single Endpoints:\n")
        print("-" * 70)
        
        for endpoint in test_endpoints:
            url = Config.get_api_url(f"/get/{endpoint}")
            
            try:
                response = requests.get(url, headers=headers, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    print(f"\n📌 Endpoint: {endpoint}")
                    
                    if "Values" in data and data["Values"]:
                        print("   Fields in response:")
                        for field_name, field_value in data["Values"].items():
                            print(f"      • '{field_name}': {type(field_value).__name__} = {field_value}")
                    else:
                        print(f"   Response: {data}")
                else:
                    print(f"\n❌ Endpoint: {endpoint} - Status {response.status_code}")
                    
            except Exception as e:
                print(f"\n❌ Endpoint: {endpoint} - Error: {e}")
        
        # Test subscriptions to see what fields they return
        print("\n\n" + "-" * 70)
        print("Testing Subscriptions:\n")
        
        sub_id = 999
        test_sub_endpoints = [
            "CurrentDrivableActor.Function.HUD_GetSpeed",
            "CurrentDrivableActor.Function.HUD_GetBrakeGauge_1",
        ]
        
        print(f"Creating subscription {sub_id} with test endpoints...")
        
        for endpoint in test_sub_endpoints:
            url = Config.get_api_url(f"/subscription/{endpoint}")
            response = requests.post(url, headers=headers, params={"Subscription": sub_id}, timeout=5)
            print(f"  Added: {endpoint} (Status: {response.status_code})")
        
        print(f"\nPolling subscription {sub_id}...")
        url = Config.get_api_url("/subscription")
        response = requests.get(url, headers=headers, params={"Subscription": sub_id}, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nSubscription response structure:")
            print(json.dumps(data, indent=2))
            
            if "Entries" in data:
                for entry in data["Entries"]:
                    path = entry.get("Path")
                    values = entry.get("Values", {})
                    print(f"\n  📌 Path: {path}")
                    if values:
                        print("     Fields:")
                        for field_name, field_value in values.items():
                            print(f"       • '{field_name}': {type(field_value).__name__} = {field_value}")
        
        # Clean up
        print(f"\n\nCleaning up subscription {sub_id}...")
        url = Config.get_api_url("/subscription")
        response = requests.delete(url, headers=headers, params={"Subscription": sub_id}, timeout=5)
        print(f"Deleted (Status: {response.status_code})")
        
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
        print("\nMake sure TSW6 is running with -HTTPAPI parameter enabled")


if __name__ == "__main__":
    discover_fields()
