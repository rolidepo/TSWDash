"""
API Poller Module
Handles polling the TSW External Interface API
Manages subscriptions, single endpoints, and patch requests
"""
import json
import re
import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import threading
from typing import Dict, Any, Optional, List
from datetime import datetime
from dataclasses import dataclass, field
from pathlib import Path
from config import Config

# Import debug flag
DEBUG = Config.DEBUG


@dataclass
class PolledData:
    """Container for polled API data"""
    timestamp: datetime
    subscription_id: int
    variables: Dict[str, Any] = field(default_factory=dict)


class APIPoller:
    """Main API polling handler"""
    
    def __init__(self, api_key: str, endpoints_config: Dict[str, Any]):
        """
        Initialize the API poller
        
        Args:
            api_key: The API authentication key
            endpoints_config: Configuration loaded from api_endpoints.json
        """
        self.api_key = api_key
        self.endpoints_config = endpoints_config
        self.headers = {"DTGCommKey": api_key}
        
        # Set up requests session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=2,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST", "PATCH", "DELETE"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=1, pool_maxsize=1)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # State tracking - Three-level system
        self.game_status = "offline"  # offline, online, in_session
        self.previous_game_status = None  # Track state changes
        self.subscriptions_setup = False  # Track if subscriptions are actively set up
        self.active_subscriptions: Dict[int, bool] = {}
        self.last_poll_time: Dict[Any, float] = {}
        self.last_camera_mode = None  # Track camera mode for session detection
        
        # Data storage
        self.latest_data: Dict[str, Any] = {}
        self.discovered_variables: Dict[str, Dict[str, Any]] = {}  # Track variable metadata
        
        # Runtime variables file
        self.variables_file_path = Path(__file__).parent / "runtime_variables.json"
        self.last_variables_write = 0
        self.variables_write_interval = 2.0  # Write every 2 seconds
        
        # Threading
        self.polling_thread: Optional[threading.Thread] = None
        self.is_running = False
        self.lock = threading.Lock()
        
        if DEBUG:
            if DEBUG:

                print("[APIPoller] Initialized")
    
    def start(self):
        """Start the polling thread"""
        if self.is_running:
            if DEBUG:
                if DEBUG:

                    print("[APIPoller] Poller already running")
            return
        
        self.is_running = True
        self.polling_thread = threading.Thread(target=self._polling_loop, daemon=True)
        self.polling_thread.start()
        if DEBUG:
            if DEBUG:

                print("[APIPoller] Polling thread started")
    
    def stop(self):
        """Stop the polling thread"""
        self.is_running = False
        if self.polling_thread:
            self.polling_thread.join(timeout=2)
        # Write final variables file before stopping
        self._write_variables_file()
        # Close the session
        if self.session:
            self.session.close()
        if DEBUG:
            if DEBUG:

                print("[APIPoller] Polling thread stopped")
    
    def _polling_loop(self):
        """
        Main polling loop with three-state game detection:
        1. OFFLINE - Game not running, poll player_info endpoint only
        2. ONLINE - Game running, player not in session yet
        3. IN_SESSION - Player driving (FirstPerson_Driving), subscriptions active
        """
        error_count = 0
        while self.is_running:
            try:
                # Step 1: Always check if game is responding (offline vs online)
                self._check_game_online()
                
                # Step 2: If game is online, check if player is in session
                if self.game_status == "online" or self.game_status == "in_session":
                    self._check_player_session()
                
                # Step 3: Poll all single endpoints (not session-dependent)
                self._poll_single_endpoints()
                
                # Step 4: Poll subscriptions only if in_session
                if self.game_status == "in_session":
                    self._poll_subscriptions()
                
                # Handle state transitions
                self._handle_state_transitions()
                
                # Periodically write discovered variables to file
                self._maybe_write_variables_file()
                
                # Reset error count on successful iteration
                error_count = 0
                
                # Adaptive sleep - shorter when polling, longer if having issues
                time.sleep(0.1)
                
            except Exception as e:
                error_count += 1
                if DEBUG:
                    print(f"[APIPoller] Error in polling loop (count: {error_count}): {type(e).__name__}: {e}")
                # Back off exponentially on repeated errors, max 5 seconds
                backoff = min(5.0, 0.5 * (2 ** (error_count - 1)))
                time.sleep(backoff)
    
    def _check_game_online(self) -> bool:
        """
        Check if the game is running by polling the first single endpoint (player_info).
        This runs continually to detect when the game starts/stops.
        
        Returns:
            bool: True if game is online, False if offline
        """
        try:
            # Get the first single endpoint (should be player_info)
            single_endpoints = self.endpoints_config.get("single_endpoints", [])
            if not single_endpoints:
                if DEBUG:
                    print("[APIPoller] No single endpoints configured")
                return False
            
            game_check_endpoint = single_endpoints[0]  # First endpoint
            endpoint_id = game_check_endpoint.get("id")
            
            # Check frequency (poll at the configured rate)
            if not self._should_poll(f"game_check_{endpoint_id}"):
                return self.game_status != "offline"
            
            # Try to poll the endpoint
            path = game_check_endpoint.get("path")
            url = Config.get_api_url(f"/get/{path}")
            
            response = self.session.get(
                url,
                headers=self.headers,
                timeout=Config.REQUEST_TIMEOUT
            )
            
            is_reachable = response.status_code == 200
            
            # Update status: offline or online
            # Only transition states when necessary - preserve in_session state
            if is_reachable:
                if self.game_status == "offline":
                    # Transition: offline → online
                    print("\n[APIPoller] ========== GAME ONLINE ==========")
                    # Clean up any remaining subscriptions from previous session
                    self._cleanup_subscriptions()
                    self.game_status = "online"
                # If already online or in_session, keep current state
            else:
                if self.game_status != "offline":
                    print("[APIPoller] ========== GAME OFFLINE ==========")
                    # Clean up subscriptions if going offline from in_session
                    if self.game_status == "in_session":
                        self._remove_all_subscriptions()
                    self.game_status = "offline"
                    self.subscriptions_setup = False
                    self.last_camera_mode = None
            
            return is_reachable
            
        except requests.exceptions.RequestException as e:
            # Connection failed - game is offline
            if self.game_status != "offline":
                if DEBUG:
                    print(f"[APIPoller] Game unreachable: {type(e).__name__}")
                if self.game_status == "in_session":
                    self._remove_all_subscriptions()
                self.game_status = "offline"
                self.subscriptions_setup = False
                self.last_camera_mode = None
            return False
        except Exception as e:
            if DEBUG:
                print(f"[APIPoller] Error checking game online: {e}")
            return False
    
    def _check_player_session(self):
        """
        Check if player is in a driving session by monitoring cameraMode.
        Subscriptions are only created on transition TO in_session, not on every poll.
        """
        try:
            # Find the player_info endpoint
            single_endpoints = self.endpoints_config.get("single_endpoints", [])
            player_info_endpoint = next(
                (ep for ep in single_endpoints if ep.get("id") == "player_info"),
                None
            )
            
            if not player_info_endpoint:
                return
            
            # Get the latest player_info data from latest_data
            camera_mode = self.latest_data.get("player_info.cameraMode")
            
            if camera_mode is None:
                # Data not yet available
                return
            
            # Check for session start: transition from "online" to "in_session"
            if camera_mode.endswith("_Driving") and self.game_status == "online":
                print(f"[APIPoller] ========== SESSION STARTED ({camera_mode}) ==========")
                self.game_status = "in_session"
                self.subscriptions_setup = False  # Reset flag before setup
                self._setup_all_subscriptions()
                self.subscriptions_setup = True  # Mark as set up
            
            # Check for session end: transition from "in_session" to "online"
            elif not camera_mode.endswith("_Driving") and self.game_status == "in_session":
                print(f"[APIPoller] ========== SESSION ENDED (Camera mode: {camera_mode}) ==========")
                self.game_status = "online"
                self.subscriptions_setup = False
                self._remove_all_subscriptions()
            
            self.last_camera_mode = camera_mode
            
        except Exception as e:
            if DEBUG:
                print(f"[APIPoller] Error checking player session: {e}")
    
    def _handle_state_transitions(self):
        """Handle any special logic for state transitions"""
        if self.game_status != self.previous_game_status:
            if DEBUG:
                print(f"[APIPoller] Status changed: {self.previous_game_status} → {self.game_status}")
            self.previous_game_status = self.game_status
    
    def _cleanup_subscriptions(self):
        """
        Clean up any remaining subscriptions from a previous session.
        Called when game comes online to ensure clean state.
        """
        try:
            subscriptions = self.endpoints_config.get("subscriptions", [])
            for subscription in subscriptions:
                sub_id = subscription.get("id")
                self._remove_subscription_by_id(sub_id)
            self.subscriptions_setup = False
            if len(subscriptions) > 0:
                print("[APIPoller] Previous session subscriptions cleaned up")
        except Exception as e:
            if DEBUG:
                print(f"[APIPoller] Error during cleanup: {e}")
    
    def _setup_all_subscriptions(self):
        """Set up all subscriptions from config for the current session"""
        try:
            subscriptions = self.endpoints_config.get("subscriptions", [])
            for subscription in subscriptions:
                self._setup_subscription(subscription)
        except Exception as e:
            if DEBUG:
                print(f"[APIPoller] Error setting up subscriptions: {e}")
    
    def _remove_all_subscriptions(self):
        """Remove all active subscriptions when session ends"""
        try:
            subscriptions = self.endpoints_config.get("subscriptions", [])
            print(f"[APIPoller] Removing all {len(subscriptions)} subscriptions...")
            for subscription in subscriptions:
                sub_id = subscription.get("id")
                self._remove_subscription_by_id(sub_id)
        except Exception as e:
            if DEBUG:
                print(f"[APIPoller] Error removing subscriptions: {e}")
    
    def _setup_subscription(self, subscription: Dict[str, Any]):
        """
        Set up a subscription on the API
        
        Args:
            subscription: Subscription configuration from api_endpoints.json
        """
        try:
            sub_id = subscription.get("id")
            endpoints = subscription.get("endpoints", [])
            
            print(f"[APIPoller] Setting up subscription {sub_id} with {len(endpoints)} endpoints")
            
            for endpoint in endpoints:
                url = Config.get_api_url(f"/subscription/{endpoint}")
                params = {"Subscription": sub_id}
                
                response = self.session.post(
                    url,
                    headers=self.headers,
                    params=params,
                    timeout=Config.REQUEST_TIMEOUT
                )
                
                if response.status_code != 200:
                    if DEBUG:
                        print(f"[APIPoller] Failed to subscribe to {endpoint}: {response.status_code}")
                        print(f"[APIPoller] Response: {response.text}")
                    return
            
            # Mark as active
            with self.lock:
                self.active_subscriptions[sub_id] = True
            
            print(f"[APIPoller] Subscription {sub_id} created successfully")
            
        except Exception as e:
            if DEBUG:
                print(f"[APIPoller] Error setting up subscription: {type(e).__name__}: {e}")
    
    def _remove_subscription_by_id(self, sub_id: int):
        """
        Remove a subscription by ID
        
        Args:
            sub_id: Subscription ID to remove
        """
        try:
            url = Config.get_api_url("/subscription")
            params = {"Subscription": sub_id}
            
            response = self.session.delete(
                url,
                headers=self.headers,
                params=params,
                timeout=Config.REQUEST_TIMEOUT
            )
            
            # Mark as inactive
            with self.lock:
                self.active_subscriptions[sub_id] = False
            
            print(f"[APIPoller] Subscription {sub_id} removed")
            
        except Exception as e:
            if DEBUG:
                print(f"[APIPoller] Error removing subscription {sub_id}: {type(e).__name__}: {e}")
    
    def _remove_subscription(self, subscription: Dict[str, Any]):
        """Deprecated - use _remove_subscription_by_id instead"""
        sub_id = subscription.get("id")
        self._remove_subscription_by_id(sub_id)
    
    def _poll_subscriptions(self):
        """Poll all active subscriptions"""
        for subscription in self.endpoints_config.get("subscriptions", []):
            sub_id = subscription.get("id")
            
            # Check if we should poll this subscription based on frequency
            if not self._should_poll(f"subscription_{sub_id}"):
                continue
            
            try:
                url = Config.get_api_url("/subscription")
                params = {"Subscription": sub_id}
                
                response = self.session.get(
                    url,
                    headers=self.headers,
                    params=params,
                    timeout=Config.REQUEST_TIMEOUT
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extract and map variables
                    variables = subscription.get("variables", {})
                    
                    # API returns 'Entries' array with each endpoint's data
                    if "Entries" in data and len(data["Entries"]) > 0:
                        # Process each entry in the subscription
                        with self.lock:
                            for entry in data["Entries"]:
                                path = entry.get("Path")
                                entry_values = entry.get("Values", {})
                                
                                # Look for this path in our variable mappings
                                if path in variables:
                                    var_name = variables[path]
                                    if entry_values:
                                        # Flatten nested values with dot notation
                                        flattened = self._flatten_nested_dict(entry_values, var_name)
                                        self.latest_data.update(flattened)
                                        
                                        # Track variable metadata
                                        for full_var_name, value in flattened.items():
                                            self._track_variable(full_var_name, path, value)
                        
                        # Log to console
                        self._log_subscription_data(sub_id, data)
                    else:
                        if DEBUG:

                            print(f"[APIPoller] No entries in subscription {sub_id} response")
                
            except Exception as e:
                if DEBUG:

                    print(f"[APIPoller] Error polling subscription {sub_id}: {type(e).__name__}: {e}")
    
    def _poll_single_endpoints(self):
        """Poll all single endpoints"""
        for endpoint_config in self.endpoints_config.get("single_endpoints", []):
            endpoint_id = endpoint_config.get("id")
            
            # Skip subscription status endpoint (handled separately)
            if endpoint_id == "session_status":
                continue
            
            # Check if we should poll based on frequency
            if not self._should_poll(endpoint_id):
                continue
            
            try:
                path = endpoint_config.get("path")
                url = Config.get_api_url(f"/get/{path}")
                
                response = self.session.get(
                    url,
                    headers=self.headers,
                    timeout=Config.REQUEST_TIMEOUT
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # API returns Values dict with field names as keys
                    if "Values" in data and data["Values"]:
                        values_dict = data["Values"]
                        
                        # Map to variable name
                        variables = endpoint_config.get("variables", {})
                        
                        with self.lock:
                            # Get the base variable name
                            if variables:
                                # Use the first mapped variable as base name
                                base_name = next(iter(variables.values()))
                                
                                # Flatten nested values with dot notation
                                flattened = self._flatten_nested_dict(values_dict, base_name)
                                self.latest_data.update(flattened)
                                
                                # Track variable metadata
                                for full_var_name, value in flattened.items():
                                    self._track_variable(full_var_name, path, value)
                            else:
                                # No mapping defined, use endpoint_id as base
                                flattened = self._flatten_nested_dict(values_dict, endpoint_id)
                                self.latest_data.update(flattened)
                                
                                for full_var_name, value in flattened.items():
                                    self._track_variable(full_var_name, path, value)
                        
                        # Log to console
                        self._log_single_endpoint_data(endpoint_id, path, flattened)
                    else:
                        if DEBUG:

                            print(f"[APIPoller] No values in endpoint {endpoint_id} response: {data}")
                else:
                    if DEBUG:

                        print(f"[APIPoller] Failed to get endpoint {endpoint_id}: {response.status_code}")
                
            except Exception as e:
                if DEBUG:

                    print(f"[APIPoller] Error polling endpoint {endpoint_id}: {type(e).__name__}: {e}")
    
    def _should_poll(self, poll_id: Any) -> bool:
        """
        Check if enough time has passed since last poll
        
        Args:
            poll_id: Unique identifier for this poll operation
            
        Returns:
            bool: True if enough time has passed to poll again
        """
        # Get the frequency from config
        frequency_ms = None
        
        # Check subscriptions
        for sub in self.endpoints_config.get("subscriptions", []):
            if sub.get("id") == poll_id or f"subscription_{sub.get('id')}" == poll_id:
                frequency_ms = sub.get("frequency_ms")
                break
        
        # Check single endpoints
        if frequency_ms is None:
            for endpoint in self.endpoints_config.get("single_endpoints", []):
                if endpoint.get("id") == poll_id:
                    frequency_ms = endpoint.get("frequency_ms")
                    break
        
        if frequency_ms is None:
            frequency_ms = 1000  # Default to 1 second
        
        frequency_sec = frequency_ms / 1000.0
        current_time = time.time()
        
        if poll_id not in self.last_poll_time:
            self.last_poll_time[poll_id] = current_time
            return True
        
        if current_time - self.last_poll_time[poll_id] >= frequency_sec:
            self.last_poll_time[poll_id] = current_time
            return True
        
        return False
    
    def _log_subscription_data(self, sub_id: int, response_data: Dict[str, Any]):
        """Log subscription data to console"""
        if DEBUG:
            print(f"\n[Subscription {sub_id}] {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
        
        entries = response_data.get("Entries", [])
        for entry in entries:
            path = entry.get("Path", "Unknown")
            values = entry.get("Values", {})
            
            # Get the variable name for this path from config
            subscription_config = next(
                (sub for sub in self.endpoints_config.get("subscriptions", []) 
                 if sub.get("id") == sub_id),
                None
            )
            
            if subscription_config:
                variable_mappings = subscription_config.get("variables", {})
                var_name = variable_mappings.get(path, path)
                
                if DEBUG:
                    print(f"  Path: {path}")
                
                if values:
                    # Flatten and display all nested values
                    flattened = self._flatten_nested_dict(values, var_name)
                    for full_var_name, value in flattened.items():
                        if DEBUG:
                            print(f"    {full_var_name}: {value}")
                else:
                    if DEBUG:
                        print(f"    {var_name}: <No data>")
    
    def _log_single_endpoint_data(self, endpoint_id: str, path: str, flattened_vars: Dict[str, Any]):
        """Log single endpoint data to console"""
        if DEBUG:
            print(f"\n[{endpoint_id}] {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
            print(f"  Path: {path}")
            for var_name, value in flattened_vars.items():
                print(f"  {var_name}: {value}")
    
    def send_patch(self, path: str, value: Any) -> bool:
        """
        Send a PATCH request to update a value in the game
        
        Args:
            path: The API path (from /set onwards)
            value: The value to set
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            url = Config.get_api_url(f"/set/{path}")
            params = {"Value": value}
            
            response = self.session.patch(
                url,
                headers=self.headers,
                params=params,
                timeout=Config.REQUEST_TIMEOUT
            )
            
            if response.status_code == 200:
                if DEBUG:

                    print(f"[APIPoller] PATCH successful: {path} = {value}")
                return True
            else:
                if DEBUG:

                    print(f"[APIPoller] PATCH failed: {path} - Status {response.status_code}")
                return False
                
        except Exception as e:
            if DEBUG:

                print(f"[APIPoller] Error sending PATCH: {type(e).__name__}: {e}")
            return False
    
    def get_latest_data(self) -> Dict[str, Any]:
        """
        Get the latest polled data
        
        Returns:
            dict: Dictionary of all variables and their latest values
        """
        with self.lock:
            return self.latest_data.copy()

    @staticmethod
    def _normalize_field_name(field_name: str) -> str:
        """Normalize API field names into safe identifier segments."""
        if not isinstance(field_name, str):
            field_name = str(field_name)
        normalized = re.sub(r"[^A-Za-z0-9]+", "_", field_name).strip("_")
        return normalized or "value"
    
    def _flatten_nested_dict(self, data: Dict[str, Any], base_name: str, parent_key: str = "") -> Dict[str, Any]:
        """
        Recursively flatten a nested dictionary into dot-notation variables.
        Sanitizes key names to remove spaces and special characters.
        
        Args:
            data: The dictionary to flatten
            base_name: Base variable name (e.g., 'driver_info')
            parent_key: Current path in recursion (for building the full key)
            
        Returns:
            Flattened dictionary with dot-notation keys
            
        Example:
            Input: {'geoLocation': {'longitude': 0.52, 'latitude': 51.38}}
            Base: 'driver_info'
            Output: {
                'driver_info.geoLocation.longitude': 0.52,
                'driver_info.geoLocation.latitude': 51.38
            }
            
            With spaces/brackets:
            Input: {'Speed (ms)': 100}
            Output: {'driver_info.Speed_ms': 100}
        """
        flattened = {}
        
        for key, value in data.items():
            # Sanitize the key to remove spaces and special characters
            sanitized_key = self._sanitize_key(key)
            
            # Build the full key path
            if parent_key:
                full_key = f"{parent_key}.{sanitized_key}"
            else:
                full_key = sanitized_key
            
            # Check if value is a nested dict or list
            if isinstance(value, dict) and value:
                # Recursively flatten nested dictionaries
                nested = self._flatten_nested_dict(value, base_name, full_key)
                flattened.update(nested)
            elif isinstance(value, list):
                # Handle lists by indexing
                for i, item in enumerate(value):
                    indexed_key = f"{full_key}[{i}]"
                    if isinstance(item, dict) and item:
                        nested = self._flatten_nested_dict(item, base_name, indexed_key)
                        flattened.update(nested)
                    else:
                        # Primitive value in list
                        var_name = f"{base_name}.{indexed_key}"
                        flattened[var_name] = item
            else:
                # Primitive value (string, number, bool, None)
                var_name = f"{base_name}.{full_key}"
                flattened[var_name] = value
        
        return flattened
    
    def _sanitize_key(self, key: str) -> str:
        """
        Sanitize a dictionary key to make it a valid variable name.
        Removes spaces, parentheses, and special characters.
        Preserves unit information when present (e.g., "(ms)" becomes "_ms").
        
        Args:
            key: The key to sanitize (e.g., 'Speed (ms)', 'WhiteNeedle (Pa)')
            
        Returns:
            Sanitized key (e.g., 'Speed_ms', 'WhiteNeedle_Pa')
            
        Examples:
            'Speed (ms)' → 'Speed_ms'
            'WhiteNeedle (Pa)' → 'WhiteNeedle_Pa'
            'RedNeedle (Pa)' → 'RedNeedle_Pa'
            'simple_name' → 'simple_name'
        """
        # Replace content in parentheses with underscore + content (removes spaces and parens)
        # "Speed (ms)" → "Speed_ms"
        sanitized = re.sub(r'\s*\(([^)]*)\)\s*', r'_\1', key)
        
        # Replace remaining spaces with underscores
        sanitized = sanitized.replace(' ', '_')
        
        # Remove any other special characters except underscores
        sanitized = re.sub(r'[^a-zA-Z0-9_]', '', sanitized)
        
        # Remove multiple consecutive underscores
        sanitized = re.sub(r'_+', '_', sanitized)
        
        # Remove leading/trailing underscores
        sanitized = sanitized.strip('_')
        
        return sanitized
    
    def _track_variable(self, var_name: str, endpoint_path: str, value: Any):
        """
        Track metadata about discovered variables.
        
        Args:
            var_name: Full variable name (e.g., 'driver_info.geoLocation.longitude')
            endpoint_path: API endpoint path
            value: Current value
        """
        if var_name not in self.discovered_variables:
            self.discovered_variables[var_name] = {
                "endpoint": endpoint_path,
                "type": type(value).__name__,
                "first_seen": datetime.now().isoformat(),
                "sample_value": value
            }
    
    def _maybe_write_variables_file(self):
        """Write variables file if enough time has passed."""
        current_time = time.time()
        if current_time - self.last_variables_write >= self.variables_write_interval:
            self._write_variables_file()
            self.last_variables_write = current_time
    
    def _write_variables_file(self):
        """Write discovered variables to a JSON file for reference."""
        try:
            with self.lock:
                # Prepare output data
                output = {
                    "timestamp": datetime.now().isoformat(),
                    "total_variables": len(self.discovered_variables),
                    "variables": {}
                }
                
                # Group variables by base name
                grouped = {}
                for var_name, metadata in self.discovered_variables.items():
                    # Extract base name (first part before dot)
                    parts = var_name.split(".")
                    base = parts[0] if parts else var_name
                    
                    if base not in grouped:
                        grouped[base] = []
                    
                    # Get current value
                    current_value = self.latest_data.get(var_name, "<not available>")
                    
                    grouped[base].append({
                        "name": var_name,
                        "endpoint": metadata["endpoint"],
                        "type": metadata["type"],
                        "first_seen": metadata["first_seen"],
                        "current_value": current_value
                    })
                
                output["variables"] = grouped
                
                # Write to file
                with open(self.variables_file_path, 'w', encoding='utf-8') as f:
                    json.dump(output, f, indent=2, ensure_ascii=False)
                
                if DEBUG:
                    print(f"\n[APIPoller] Variables file updated: {self.variables_file_path} ({len(self.discovered_variables)} variables)")
                    
        except Exception as e:
            if DEBUG:
                print(f"[APIPoller] Error writing variables file: {e}")
