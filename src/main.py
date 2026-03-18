"""
TSW External Interface API Polling Application
Main entry point for the MFD dashboard backend
"""
import sys
import time
import signal
import threading
from config import Config
from api_poller import APIPoller
from web_server import WebDashboard


class TSWPollerApplication:
    """Main application class"""
    
    def __init__(self):
        self.poller: APIPoller = None
        self.dashboard: WebDashboard = None
        self.web_thread: threading.Thread = None
        self.is_running = True
        self.server = None
    
    def initialize(self):
        """Initialize the application"""
        print("\n" + "="*60)
        print("TSW External Interface API Poller")
        print("="*60 + "\n")
        
        try:
            # Validate and load configuration
            print("[Main] Loading configuration...")
            Config.validate_config()
            
            # Load API key
            api_key = Config.load_api_key()
            
            # Load endpoints configuration
            endpoints_config = Config.load_endpoints()
            
            # Initialize poller (but don't start yet)
            print("[Main] Initializing API poller...")
            self.poller = APIPoller(api_key, endpoints_config)
            
            # Initialize web dashboard FIRST (so it's immediately accessible)
            print("[Main] Initializing web dashboard...")
            self.dashboard = WebDashboard(self.poller, host="0.0.0.0", port=5000)
            
            # Start web server in a separate thread
            print("[Main] Starting web server thread...")
            self.web_thread = threading.Thread(target=self._run_web_server, daemon=False)
            self.web_thread.start()
            
            # Give web server a moment to start
            time.sleep(0.5)
            print(f"[Main] ✓ Web server started on http://0.0.0.0:5000")
            print(f"[Main]   Access at: http://localhost:5000")
            print(f"[Main]   or from other PC: http://<your-pc-ip>:5000\n")
            
            # Now start polling (after web server is ready)
            print("[Main] Starting API polling thread...")
            print("[Main] Waiting for game to come online...")
            self.poller.start()
            
            print("\n[Main] ✓ Application initialized successfully")
            print("[Main] Status:")
            print("[Main]   • Web server: Running (dashboard accessible now)")
            print("[Main]   • API poller: Running (checking for game...)")
            print("[Main] Press Ctrl+C to stop\n")
            
            return True
            
        except Exception as e:
            print(f"\n[Main] Failed to initialize: {e}")
            print("\nMake sure:")
            print("  1. TSW6 is running with -HTTPAPI launch parameter")
            print("  2. CommAPIKey.txt exists in your Documents\\My Games\\TrainSimWorld6\\Saved\\Config folder")
            print("  3. api_endpoints.json is properly configured\n")
            return False
    
    def run(self):
        """Main application loop"""
        try:
            while self.is_running:
                time.sleep(0.5)
                
        except KeyboardInterrupt:
            print("\n\n[Main] Shutdown signal received")
            self.shutdown()
    
    def _run_web_server(self):
        """Run the web server (called in separate thread)"""
        try:
            from werkzeug.serving import make_server
            
            # Create a WSGI server that can be shut down cleanly
            self.server = make_server(
                self.dashboard.host,
                self.dashboard.port,
                self.dashboard.app,
                threaded=True
            )
            
            # Run the server
            self.server.serve_forever()
            
        except Exception as e:
            if Config.DEBUG:
                print(f"[Main] Web server error: {e}")
            self.is_running = False
    
    def shutdown(self):
        """Shutdown the application gracefully"""
        print("[Main] Shutting down...")
        self.is_running = False
        
        # Stop the API poller first
        if self.poller:
            self.poller.stop()
        
        # Shutdown the web server
        if self.server:
            self.server.shutdown()
        
        # Wait for web thread to finish (with timeout)
        if self.web_thread and self.web_thread.is_alive():
            self.web_thread.join(timeout=2)
        
        print("[Main] Application stopped")


def main():
    """Entry point"""
    app = TSWPollerApplication()
    
    # Set up signal handlers for graceful shutdown
    def signal_handler(sig, frame):
        app.shutdown()
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Initialize and run
    if app.initialize():
        try:
            app.run()
        except KeyboardInterrupt:
            app.shutdown()
        except Exception as e:
            print(f"\n[Main] Unexpected error: {e}")
            app.shutdown()


if __name__ == "__main__":
    main()
