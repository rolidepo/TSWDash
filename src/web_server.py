"""
Web Server Module
Provides a simple web dashboard for displaying polled API data
"""
from flask import Flask, render_template, jsonify, send_from_directory, request
from typing import Dict, Any, Optional
import json
from pathlib import Path
from config import Config


ROUTE_EDITOR_TEMPLATE_PATH = Path(__file__).parent / "timetable" / "route" / "route_editor_template.json"
TIMETABLE_EDITOR_TEMPLATE_PATH = Path(__file__).parent / "timetable" / "schedule" / "timetable_editor_template.json"
TRAIN_INFO_DATA_PATH = Path(__file__).parent / "timetable" / "schedule" / "train_info_data.json"


def _deep_copy_json(value):
    return json.loads(json.dumps(value, ensure_ascii=False))


def _infer_template_default(value):
    if value is None:
        return None
    if isinstance(value, bool):
        return False
    if isinstance(value, (int, float)):
        return 0
    if isinstance(value, str):
        return ""
    return None


def _load_route_editor_template_config() -> Dict[str, Any]:
    """Load route editor template from the JSON file.

    All configuration lives in timetable/route/route_editor_template.json.
    If the file is missing or cannot be parsed, a RuntimeError is raised so
    the issue is immediately visible rather than silently falling back to a
    hardcoded default that would diverge from the file over time.
    """
    if not ROUTE_EDITOR_TEMPLATE_PATH.exists():
        raise RuntimeError(
            f"Route editor template file not found: {ROUTE_EDITOR_TEMPLATE_PATH}\n"
            "Please ensure the file exists before starting the server."
        )

    try:
        with open(ROUTE_EDITOR_TEMPLATE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as exc:
        raise RuntimeError(
            f"Failed to parse route editor template: {ROUTE_EDITOR_TEMPLATE_PATH}\n{exc}"
        ) from exc

    if not isinstance(data, dict):
        raise RuntimeError(
            f"Route editor template must be a JSON object: {ROUTE_EDITOR_TEMPLATE_PATH}"
        )

    # Ensure required keys exist with sane empty types; content is the file's responsibility.
    if not isinstance(data.get("route_info_template"), dict):
        data["route_info_template"] = {}
    if not isinstance(data.get("entry_template"), dict):
        data["entry_template"] = {}
    if not isinstance(data.get("route_info_order"), list):
        data["route_info_order"] = []
    if not isinstance(data.get("entry_group_order"), list):
        data["entry_group_order"] = []
    if not isinstance(data.get("entry_display_groups"), dict):
        data["entry_display_groups"] = {}

    return data


def _load_timetable_editor_template() -> Dict[str, Any]:
    """Load timetable editor template from schedule template JSON."""
    if not TIMETABLE_EDITOR_TEMPLATE_PATH.exists():
        raise RuntimeError(
            f"Timetable editor template file not found: {TIMETABLE_EDITOR_TEMPLATE_PATH}"
        )

    try:
        with open(TIMETABLE_EDITOR_TEMPLATE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as exc:
        raise RuntimeError(
            f"Failed to parse timetable editor template: {TIMETABLE_EDITOR_TEMPLATE_PATH}\n{exc}"
        ) from exc

    if not isinstance(data, dict):
        raise RuntimeError(
            f"Timetable editor template must be a JSON object: {TIMETABLE_EDITOR_TEMPLATE_PATH}"
        )

    if not isinstance(data.get("train_info"), dict):
        data["train_info"] = {}
    if not isinstance(data.get("timetable_data"), list):
        data["timetable_data"] = []

    return data


def _load_train_info_data() -> Dict[str, Any]:
    """Load timetable editor train_info dropdown/value metadata."""
    if not TRAIN_INFO_DATA_PATH.exists():
        raise RuntimeError(
            f"Train info data file not found: {TRAIN_INFO_DATA_PATH}"
        )

    try:
        with open(TRAIN_INFO_DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as exc:
        raise RuntimeError(
            f"Failed to parse train info data: {TRAIN_INFO_DATA_PATH}\n{exc}"
        ) from exc

    if not isinstance(data, dict):
        raise RuntimeError(
            f"Train info data must be a JSON object: {TRAIN_INFO_DATA_PATH}"
        )

    if not isinstance(data.get("companies"), list):
        data["companies"] = []
    if not isinstance(data.get("priorities"), list):
        data["priorities"] = []
    if not isinstance(data.get("route_codes"), list):
        data["route_codes"] = []

    return data


def _save_route_editor_template_config(template_data: Dict[str, Any]) -> None:
    ROUTE_EDITOR_TEMPLATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(ROUTE_EDITOR_TEMPLATE_PATH, "w", encoding="utf-8") as f:
        json.dump(template_data, f, indent=2, ensure_ascii=False)


def _merge_saved_fields_into_route_editor_template(payload: Dict[str, Any]) -> Dict[str, Any]:
    template_data = _load_route_editor_template_config()
    route_info_template = template_data.get("route_info_template", {})
    entry_template = template_data.get("entry_template", {})
    route_info_order = template_data.get("route_info_order", [])
    entry_group_order = template_data.get("entry_group_order", [])
    entry_display_groups = template_data.get("entry_display_groups", {})

    route_info = payload.get("route_info")
    if isinstance(route_info, dict):
        for key, value in route_info.items():
            if key not in route_info_template:
                route_info_template[key] = _infer_template_default(value)
            if key not in route_info_order:
                route_info_order.append(key)

    all_entries = []
    timetable_entries = payload.get("timetable_entries")
    if isinstance(timetable_entries, list):
        all_entries.extend([entry for entry in timetable_entries if isinstance(entry, dict)])

    timetable_entries_alt = payload.get("timetable_entries_alt")
    if isinstance(timetable_entries_alt, list):
        all_entries.extend([entry for entry in timetable_entries_alt if isinstance(entry, dict)])

    for entry in all_entries:
        for key, value in entry.items():
            if key not in entry_template:
                entry_template[key] = _infer_template_default(value)
            if not any(isinstance(keys, list) and key in keys for keys in entry_display_groups.values()):
                entry_display_groups.setdefault("Other", [])
                if key not in entry_display_groups["Other"]:
                    entry_display_groups["Other"].append(key)
                if "Other" not in entry_group_order:
                    entry_group_order.append("Other")

    merged = _deep_copy_json(template_data)
    merged["route_info_template"] = route_info_template
    merged["entry_template"] = entry_template
    merged["route_info_order"] = route_info_order
    merged["entry_group_order"] = entry_group_order
    merged["entry_display_groups"] = entry_display_groups
    _save_route_editor_template_config(merged)
    return merged


class WebDashboard:
    """Web dashboard server for displaying API data"""
    
    def __init__(self, api_poller, host: str = "0.0.0.0", port: int = 5000):
        """
        Initialize the web dashboard
        
        Args:
            api_poller: The APIPoller instance to get data from
            host: Host to bind to (0.0.0.0 = network accessible)
            port: Port to run on
        """
        self.api_poller = api_poller
        self.host = host
        self.port = port
        
        # Create Flask app
        self.app = Flask(
            __name__,
            template_folder=str(Path(__file__).parent / "templates"),
            static_folder=str(Path(__file__).parent / "static")
        )
        # Prevent Flask/jsonify from alphabetically sorting JSON keys;
        # key order is managed explicitly by the save endpoint.
        self.app.config['JSON_SORT_KEYS'] = False
        
        # Load dashboard configuration
        self.dashboard_config = self._load_dashboard_config()
        
        # Load pages configuration
        self.pages_config = self._load_pages_config()
        
        # Set up routes
        self._setup_routes()
        
        # Disable Flask/Werkzeug HTTP request logging
        import logging
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.ERROR)
        
        if Config.DEBUG:
            print(f"[WebDashboard] Initialized on {host}:{port}")
    
    def _load_dashboard_config(self) -> Dict[str, Any]:
        """Load dashboard configuration from JSON file"""
        config_path = Path(__file__).parent / "dashboard_config.json"
        
        if config_path.exists():
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                if Config.DEBUG:
                    print(f"[WebDashboard] Configuration loaded from {config_path}")
                return config
        else:
            # Default configuration
            default_config = {
                "title": "TSW MFD Dashboard",
                "sections": [
                    {
                        "name": "Train Speed",
                        "variables": ["speed_ms", "rpm"]
                    },
                    {
                        "name": "Brake System",
                        "variables": ["brake_pressure_1", "brake_pressure_2"]
                    },
                    {
                        "name": "Electrical",
                        "variables": ["voltage", "amperage"]
                    },
                    {
                        "name": "Weather",
                        "variables": ["temperature"]
                    }
                ]
            }
            
            # Save default config
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=2)
            
            if Config.DEBUG:
                print(f"[WebDashboard] Created default configuration at {config_path}")
            return default_config
    
    def _load_pages_config(self) -> Dict[str, Any]:
        """Load pages configuration from individual page files or fallback to monolithic file"""
        # Try loading from pages folder first (new structure)
        pages_dir = Path(__file__).parent / "pages"
        if pages_dir.exists():
            from pages_config_loader import load_pages_config
            config = load_pages_config(str(pages_dir))
            if config:
                if Config.DEBUG:
                    print(f"[WebDashboard] Pages configuration loaded from {pages_dir}")
                return config
        
        # Fallback to monolithic pages_config.json (legacy)
        config_path = Path(__file__).parent / "pages_config.json"
        if config_path.exists():
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                if Config.DEBUG:
                    print(f"[WebDashboard] Pages configuration loaded from {config_path}")
                return config
        else:
            # Return empty config if neither exists
            if Config.DEBUG:
                print(f"[WebDashboard] Pages configuration not found")
            return {"pages": {}, "settings": {"default_page": "dashboard"}}
    
    def _setup_routes(self):
        """Set up Flask routes"""
        
        @self.app.route("/")
        def index():
            """Serve the main dashboard page - routes to configured template"""
            # Get template from pages_config settings
            template_name = self.pages_config.get("settings", {}).get("template", "mfd")
            return render_template(f"{template_name}.html")
        
        @self.app.route("/mfd")
        def mfd():
            """Serve the MFD page directly"""
            return render_template("mfd.html")
        
        @self.app.route("/touchscreen")
        def touchscreen():
            """Serve the touchscreen page directly"""
            return render_template("touchscreen.html")
        
        @self.app.route("/support-tool")
        def support_tool():
            """Serve the support tool for timetable editing"""
            return render_template("support-tool.html")

        @self.app.route("/route-editor")
        def route_editor():
            """Serve the route JSON editor tool"""
            return render_template("route-editor.html")

        @self.app.route("/timetable-editor")
        def timetable_editor():
            """Serve the timetable JSON editor tool"""
            return render_template("timetable-editor.html")
        
        @self.app.route("/components.js")
        def serve_components():
            """Serve components.js from templates directory"""
            templates_path = Path(__file__).parent / "templates"
            return send_from_directory(str(templates_path), "components.js")
        
        @self.app.route("/canvas-renderers.js")
        def serve_canvas_renderers():
            """Serve canvas-renderers.js from templates directory"""
            templates_path = Path(__file__).parent / "templates"
            return send_from_directory(str(templates_path), "canvas-renderers.js")
        
        @self.app.route("/picto-icons/<filename>")
        def serve_picto_icon(filename):
            """Serve picto icons from templates/picto_icons directory"""
            templates_path = Path(__file__).parent / "templates" / "picto_icons"
            return send_from_directory(str(templates_path), filename)
        
        @self.app.route("/api/data")
        def get_data():
            """Get all current polled data as JSON"""
            data = self.api_poller.get_latest_data()
            game_status = self.api_poller.game_status
            
            return jsonify({
                "game_status": game_status,  # offline, online, in_session
                "data": data,
                "timestamp": self._get_timestamp()
            })
        
        @self.app.route("/api/config")
        def get_config():
            """Get dashboard configuration"""
            return jsonify(self.dashboard_config)
        
        @self.app.route("/api/pages")
        def get_pages():
            """Get pages configuration"""
            return jsonify(self.pages_config)
        
        @self.app.route("/api/schedules/list")
        def list_schedules():
            """List all available timetable schedule files"""
            schedules_dir = Path(__file__).parent / "timetable" / "schedule"
            schedules = []
            
            if schedules_dir.exists():
                for file_path in schedules_dir.glob("*.json"):
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            train_info = data.get('train_info', {})
                            schedules.append({
                                'filename': file_path.name,
                                'route_code': train_info.get('route_code', ''),
                                'train_number': train_info.get('train_number', file_path.stem),
                                'destination': train_info.get('destination', '')
                            })
                    except Exception as e:
                        if Config.DEBUG:
                            print(f"[WebDashboard] Error reading schedule {file_path.name}: {e}")
                        continue
            
            # Sort by train number
            schedules.sort(key=lambda s: s['train_number'])
            
            return jsonify({"schedules": schedules})
        
        @self.app.route("/api/schedules/load/<filename>")
        def load_schedule(filename):
            """Load a specific timetable schedule file"""
            schedules_dir = Path(__file__).parent / "timetable" / "schedule"
            file_path = schedules_dir / filename
            
            # Security: ensure the file is within the schedules directory
            if not file_path.resolve().is_relative_to(schedules_dir.resolve()):
                return jsonify({"error": "Invalid file path"}), 403
            
            if not file_path.exists():
                return jsonify({"error": "Schedule file not found"}), 404
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return jsonify(data)
            except Exception as e:
                return jsonify({"error": str(e)}), 500
        
        @self.app.route("/api/service-timetables/load/<filename>")
        def load_service_timetable(filename):
            """Load a specific service timetable file from route directory"""
            route_dir = Path(__file__).parent / "timetable" / "route"
            file_path = route_dir / filename
            
            # Security: ensure the file is within the route directory
            if not file_path.resolve().is_relative_to(route_dir.resolve()):
                return jsonify({"error": "Invalid file path"}), 403
            
            if not file_path.exists():
                return jsonify({"error": "Service timetable file not found"}), 404
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return jsonify(data)
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.app.route("/api/support-data/append", methods=["POST"])
        def append_support_data():
            """Append player geolocation to support_data.json in route directory"""
            payload = request.get_json(silent=True) or {}
            latitude = payload.get("latitude")
            longitude = payload.get("longitude")

            if latitude is None or longitude is None:
                return jsonify({"error": "Missing latitude/longitude"}), 400

            route_dir = Path(__file__).parent / "timetable" / "route"
            route_dir.mkdir(parents=True, exist_ok=True)
            file_path = route_dir / "support_data.json"

            existing = None
            entries = []
            if file_path.exists():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        existing = json.load(f)
                except Exception:
                    existing = None

            if isinstance(existing, list):
                entries = existing
            elif isinstance(existing, dict):
                existing_entries = existing.get("entries")
                if isinstance(existing_entries, list):
                    entries = existing_entries

            from datetime import datetime
            entry = {
                "timestamp": datetime.now().isoformat(timespec="seconds"),
                "latitude": latitude,
                "longitude": longitude
            }
            entries.append(entry)

            if isinstance(existing, dict):
                existing["entries"] = entries
                output = existing
            else:
                output = entries

            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(output, f, indent=2)

            return jsonify({"status": "ok", "count": len(entries)})
        
        @self.app.route("/api/support-data/list-files")
        def list_timetable_files():
            """List all available route timetable files"""
            route_dir = Path(__file__).parent / "timetable" / "route"
            files = []

            if route_dir.exists():
                for file_path in sorted(route_dir.glob("*.json")):
                    if file_path.name != "support_data.json":
                        files.append(file_path.name)

            return jsonify({"files": files})

        @self.app.route("/api/support-data/save-timetable/<filename>", methods=["POST"])
        def save_timetable(filename):
            """Save an updated timetable file"""
            route_dir = Path(__file__).parent / "timetable" / "route"
            file_path = route_dir / filename

            if not file_path.resolve().is_relative_to(route_dir.resolve()):
                return jsonify({"error": "Invalid file path"}), 403

            if filename == "support_data.json":
                return jsonify({"error": "Cannot modify support_data.json"}), 403

            payload = request.get_json(silent=True)
            if not payload:
                return jsonify({"error": "No data provided"}), 400

            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    # Custom JSON formatting: entries on single lines with fixed field order
                    f.write('{\n')
                    f.write('  "route_info": ')
                    f.write(json.dumps(payload.get('route_info', {}), ensure_ascii=False, separators=(', ', ': ')))
                    f.write(',\n')
                    f.write('  "timetable_entries": [\n')
                    
                    entries = payload.get('timetable_entries', [])
                    # Define the desired field order
                    field_order = ['km', 'speed_limit', 'picto', 'location', 'station', 'latitude', 'longitude', 'notes']
                    
                    for i, entry in enumerate(entries):
                        # Rebuild entry with correct field order
                        ordered_entry = {}
                        for field in field_order:
                            if field in entry:
                                ordered_entry[field] = entry[field]
                        
                        f.write('    ')
                        f.write(json.dumps(ordered_entry, ensure_ascii=False, separators=(', ', ': ')))
                        if i < len(entries) - 1:
                            f.write(',\n')
                        else:
                            f.write('\n')
                    
                    f.write('  ]\n')
                    f.write('}\n')
                
                return jsonify({"status": "ok", "filename": filename})
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.app.route("/api/route-editor/template")
        def route_editor_template():
            """Get default template and field catalogs for route editor"""
            template_data = _load_route_editor_template_config()
            route_info_template = template_data.get("route_info_template", {})
            entry_template = template_data.get("entry_template", {})
            route_info_order = template_data.get("route_info_order", [])
            entry_group_order = template_data.get("entry_group_order", [])
            entry_display_groups = template_data.get("entry_display_groups", {})

            return jsonify({
                "route_info_template": route_info_template,
                "entry_template": entry_template,
                "entry_field_catalog": list(entry_template.keys()),
                "route_info_order": route_info_order,
                "entry_group_order": entry_group_order,
                "entry_display_groups": entry_display_groups
            })

        @self.app.route("/api/route-editor/files")
        def route_editor_list_files():
            """List route JSON files for route editor"""
            route_dir = Path(__file__).parent / "timetable" / "route"
            files = []

            if route_dir.exists():
                for file_path in sorted(route_dir.glob("*.json")):
                    if file_path.name != "support_data.json":
                        files.append(file_path.name)

            return jsonify({"files": files})

        @self.app.route("/api/route-editor/load/<filename>")
        def route_editor_load(filename):
            """Load route JSON file for route editor"""
            route_dir = Path(__file__).parent / "timetable" / "route"
            file_path = route_dir / filename

            if not file_path.resolve().is_relative_to(route_dir.resolve()):
                return jsonify({"error": "Invalid file path"}), 403

            if not file_path.exists():
                return jsonify({"error": "Route file not found"}), 404

            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                return jsonify(data)
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.app.route("/api/route-editor/create", methods=["POST"])
        def route_editor_create():
            """Create a new route JSON file from template"""
            payload = request.get_json(silent=True) or {}
            filename = str(payload.get("filename", "")).strip()

            if not filename:
                return jsonify({"error": "Filename is required"}), 400

            if not filename.lower().endswith(".json"):
                filename = f"{filename}.json"

            if any(part in ("", ".", "..") for part in Path(filename).parts):
                return jsonify({"error": "Invalid filename"}), 400

            route_dir = Path(__file__).parent / "timetable" / "route"
            route_dir.mkdir(parents=True, exist_ok=True)
            file_path = route_dir / filename

            if not file_path.resolve().is_relative_to(route_dir.resolve()):
                return jsonify({"error": "Invalid file path"}), 403

            if file_path.exists():
                return jsonify({"error": "File already exists"}), 409

            template_data = _load_route_editor_template_config()
            route_info_template = _deep_copy_json(template_data.get("route_info_template", {}))
            entry_template = _deep_copy_json(template_data.get("entry_template", {}))

            initial_data = {
                "route_info": route_info_template,
                "timetable_entries": [entry_template],
                "timetable_entries_alt": [entry_template.copy()]
            }

            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(initial_data, f, indent=2, ensure_ascii=False)
                return jsonify({"status": "ok", "filename": filename})
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.app.route("/api/route-editor/save/<filename>", methods=["POST"])
        def route_editor_save(filename):
            """Save route JSON while preserving all fields"""
            route_dir = Path(__file__).parent / "timetable" / "route"
            file_path = route_dir / filename

            route_dir.mkdir(parents=True, exist_ok=True)

            if not file_path.resolve().is_relative_to(route_dir.resolve()):
                return jsonify({"error": "Invalid file path"}), 403

            payload = request.get_json(silent=True)
            if payload is None:
                return jsonify({"error": "No data provided"}), 400

            if not isinstance(payload, dict):
                return jsonify({"error": "Payload must be an object"}), 400

            if "route_info" not in payload:
                payload["route_info"] = {}
            if "timetable_entries" not in payload:
                payload["timetable_entries"] = []
            if "timetable_entries_alt" not in payload:
                payload["timetable_entries_alt"] = []

            try:
                merged_template = _merge_saved_fields_into_route_editor_template(payload)

                route_info_order = merged_template.get("route_info_order", [])
                entry_template = merged_template.get("entry_template", {})
                entry_group_order = merged_template.get("entry_group_order", [])
                entry_display_groups = merged_template.get("entry_display_groups", {})

                def order_object_keys(source_obj, preferred_order):
                    if not isinstance(source_obj, dict):
                        return {}

                    ordered = {}
                    for key in preferred_order:
                        if key in source_obj:
                            ordered[key] = source_obj[key]

                    for key, value in source_obj.items():
                        if key not in ordered:
                            ordered[key] = value

                    return ordered

                def build_entry_key_order():
                    ordered_keys = []

                    for group_name in entry_group_order:
                        group_keys = entry_display_groups.get(group_name, [])
                        if isinstance(group_keys, list):
                            for key in group_keys:
                                if key not in ordered_keys:
                                    ordered_keys.append(key)

                    if isinstance(entry_template, dict):
                        for key in entry_template.keys():
                            if key not in ordered_keys:
                                ordered_keys.append(key)

                    return ordered_keys

                entry_key_order = build_entry_key_order()
                location_placeholder = "\u200e"

                def normalize_entry_location(entry_obj):
                    if not isinstance(entry_obj, dict):
                        normalized_entry = {}
                    else:
                        normalized_entry = dict(entry_obj)

                    location_value = normalized_entry.get("location")
                    if location_value is None:
                        normalized_entry["location"] = location_placeholder
                    elif isinstance(location_value, str):
                        if location_value.strip() == "":
                            normalized_entry["location"] = location_placeholder

                    if "location" not in normalized_entry:
                        normalized_entry["location"] = location_placeholder

                    return normalized_entry

                route_info = payload.get("route_info")
                if not isinstance(route_info, dict):
                    route_info = {}
                route_info = order_object_keys(route_info, route_info_order)

                timetable_entries = payload.get("timetable_entries")
                if not isinstance(timetable_entries, list):
                    timetable_entries = []
                timetable_entries = [
                    order_object_keys(normalize_entry_location(entry), entry_key_order)
                    for entry in timetable_entries
                ]

                timetable_entries_alt = payload.get("timetable_entries_alt")
                if not isinstance(timetable_entries_alt, list):
                    timetable_entries_alt = []
                timetable_entries_alt = [
                    order_object_keys(normalize_entry_location(entry), entry_key_order)
                    for entry in timetable_entries_alt
                ]

                def write_entries_array(file_handle, array_name, entries):
                    file_handle.write(f'  "{array_name}": [\n')
                    for index, entry in enumerate(entries):
                        normalized_entry = entry if isinstance(entry, dict) else {}
                        file_handle.write("    ")
                        file_handle.write(json.dumps(normalized_entry, ensure_ascii=False, sort_keys=False, separators=(", ", ": ")))
                        if index < len(entries) - 1:
                            file_handle.write(",\n")
                        else:
                            file_handle.write("\n")
                    file_handle.write("  ]")

                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write("{\n")
                    route_info_str = json.dumps(route_info, indent=2, ensure_ascii=False)
                    route_info_str = route_info_str.replace("\n", "\n  ")
                    f.write(f'  "route_info": {route_info_str},\n')
                    write_entries_array(f, "timetable_entries", timetable_entries)
                    f.write(",\n")
                    write_entries_array(f, "timetable_entries_alt", timetable_entries_alt)
                    f.write("\n}\n")

                return jsonify({"status": "ok", "filename": filename})
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.app.route("/api/timetable-editor/template")
        def timetable_editor_template():
            """Get timetable editor base template"""
            template_data = _load_timetable_editor_template()
            return jsonify(template_data)

        @self.app.route("/api/timetable-editor/train-info-data")
        def timetable_editor_train_info_data():
            """Get train_info dropdown and metadata values"""
            return jsonify(_load_train_info_data())

        @self.app.route("/api/timetable-editor/service-timetables")
        def timetable_editor_service_timetables():
            """List service timetable route JSON files"""
            route_dir = Path(__file__).parent / "timetable" / "route"
            files = []

            if route_dir.exists():
                for file_path in sorted(route_dir.glob("*.json")):
                    if file_path.name in {"support_data.json", "route_editor_template.json"}:
                        continue
                    files.append(file_path.name)

            return jsonify({"files": files})

        @self.app.route("/api/timetable-editor/stations/<filename>")
        def timetable_editor_stations(filename):
            """Get ordered station list and route entries from timetable_entries."""
            route_dir = Path(__file__).parent / "timetable" / "route"
            file_path = route_dir / filename

            if not file_path.resolve().is_relative_to(route_dir.resolve()):
                return jsonify({"error": "Invalid file path"}), 403

            if not file_path.exists():
                return jsonify({"error": "Service timetable file not found"}), 404

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception as exc:
                return jsonify({"error": str(exc)}), 500

            timetable_entries = data.get("timetable_entries", [])
            if not isinstance(timetable_entries, list):
                timetable_entries = []

            stations = []
            entries = []
            for index, entry in enumerate(timetable_entries):
                if not isinstance(entry, dict):
                    continue

                entries.append({
                    "index": index,
                    "km": entry.get("km"),
                    "speed_limit": entry.get("speed_limit")
                })

                if entry.get("station") is not True:
                    continue

                location = entry.get("location")
                if not isinstance(location, str) or not location.strip():
                    location = f"Station {index + 1}"

                stations.append({
                    "id": f"{index}:{location}",
                    "station": location,
                    "km": entry.get("km"),
                    "latitude": entry.get("latitude"),
                    "longitude": entry.get("longitude")
                })

            return jsonify({"stations": stations, "entries": entries})

        @self.app.route("/api/timetable-editor/schedules")
        def timetable_editor_schedules():
            """List editable schedule files (excluding metadata/template files)."""
            schedule_dir = Path(__file__).parent / "timetable" / "schedule"
            files = []

            excluded = {
                TIMETABLE_EDITOR_TEMPLATE_PATH.name,
                TRAIN_INFO_DATA_PATH.name
            }

            if schedule_dir.exists():
                for file_path in sorted(schedule_dir.glob("*.json")):
                    if file_path.name in excluded:
                        continue

                    train_info = {}
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                        if isinstance(data, dict):
                            maybe_train_info = data.get("train_info")
                            if isinstance(maybe_train_info, dict):
                                train_info = maybe_train_info
                    except Exception:
                        train_info = {}

                    files.append({
                        "filename": file_path.name,
                        "route_code": str(train_info.get("route_code", "")),
                        "company": str(train_info.get("company", "")),
                        "train_number": str(train_info.get("train_number", ""))
                    })

            return jsonify({"schedules": files})

        @self.app.route("/api/timetable-editor/load-schedule/<filename>")
        def timetable_editor_load_schedule(filename):
            """Load an existing schedule file for timetable editor."""
            schedule_dir = Path(__file__).parent / "timetable" / "schedule"
            file_path = schedule_dir / filename

            if not file_path.resolve().is_relative_to(schedule_dir.resolve()):
                return jsonify({"error": "Invalid file path"}), 403

            if not file_path.exists():
                return jsonify({"error": "Schedule file not found"}), 404

            excluded = {
                TIMETABLE_EDITOR_TEMPLATE_PATH.name,
                TRAIN_INFO_DATA_PATH.name
            }
            if file_path.name in excluded:
                return jsonify({"error": "File is not editable in timetable editor"}), 400

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                if not isinstance(data, dict):
                    return jsonify({"error": "Schedule JSON must be an object"}), 400

                if not isinstance(data.get("train_info"), dict):
                    data["train_info"] = {}
                if not isinstance(data.get("timetable_data"), list):
                    data["timetable_data"] = []

                return jsonify(data)
            except Exception as exc:
                return jsonify({"error": str(exc)}), 500

        @self.app.route("/api/timetable-editor/save", methods=["POST"])
        def timetable_editor_save():
            """Save timetable editor output JSON in timetable/schedule folder"""
            payload = request.get_json(silent=True)
            if not isinstance(payload, dict):
                return jsonify({"error": "Payload must be a JSON object"}), 400

            train_info = payload.get("train_info")
            timetable_data = payload.get("timetable_data")

            if not isinstance(train_info, dict):
                return jsonify({"error": "train_info must be an object"}), 400
            if not isinstance(timetable_data, list):
                return jsonify({"error": "timetable_data must be an array"}), 400

            route_code = str(train_info.get("route_code", "")).strip()
            company = str(train_info.get("company", "")).strip()
            train_number = str(train_info.get("train_number", "")).strip()

            if not route_code or not company or not train_number:
                return jsonify({"error": "route_code, company and train_number are required"}), 400

            def sanitize_name_part(text: str) -> str:
                cleaned = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in text)
                while "__" in cleaned:
                    cleaned = cleaned.replace("__", "_")
                return cleaned.strip("_")

            route_code_safe = sanitize_name_part(route_code)
            company_safe = sanitize_name_part(company)
            train_number_safe = sanitize_name_part(train_number)

            if not route_code_safe or not company_safe or not train_number_safe:
                return jsonify({"error": "Invalid route_code/company/train_number values"}), 400

            filename = f"{route_code_safe}_{company_safe}_{train_number_safe}.json"
            schedule_dir = Path(__file__).parent / "timetable" / "schedule"
            schedule_dir.mkdir(parents=True, exist_ok=True)
            file_path = schedule_dir / filename

            if not file_path.resolve().is_relative_to(schedule_dir.resolve()):
                return jsonify({"error": "Invalid file path"}), 403

            output = {
                "train_info": train_info,
                "timetable_data": timetable_data
            }

            try:
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(output, f, indent=2, ensure_ascii=False)
                return jsonify({"status": "ok", "filename": filename})
            except Exception as exc:
                return jsonify({"error": str(exc)}), 500
        
        @self.app.route("/api/save-completed-schedule/<route_code>/<train_number>", methods=["POST"])
        def save_completed_schedule(route_code, train_number):
            """Save a completed schedule with recorded ATA/ATD timestamps"""
            payload = request.get_json(silent=True)
            if not payload:
                return jsonify({"error": "No data provided"}), 400

            # Extract schedule data and service start times
            schedule_data = payload.get("scheduleData", [])
            game_time_at_start = payload.get("gameTimeAtStart")
            real_time_at_start = payload.get("realTimeAtStart")
            train_info = payload.get("trainInfo", {})

            if not schedule_data:
                return jsonify({"error": "No schedule data provided"}), 400

            # Calculate driven_distance_km: first kmMark - last kmMark, as positive number
            driven_distance_km = 0
            try:
                kmMarks = []
                for entry in schedule_data:
                    km = entry.get('kmMark')
                    if km is not None and km != '':
                        try:
                            kmMarks.append(float(km))
                        except (ValueError, TypeError):
                            pass
                
                if len(kmMarks) >= 2:
                    distance = kmMarks[0] - kmMarks[-1]
                    driven_distance_km = abs(distance)
            except Exception as e:
                print(f"Error calculating driven_distance_km: {e}")
                driven_distance_km = 0
            
            # Check if timetable is completed: last entry has ATA recorded
            completed_timetable = False
            try:
                if schedule_data and len(schedule_data) > 0:
                    last_entry = schedule_data[-1]
                    ata_value = last_entry.get('ATA')
                    if ata_value and str(ata_value).strip():
                        completed_timetable = True
            except Exception as e:
                print(f"Error checking completed_timetable: {e}")
                completed_timetable = False
            
            # Update train_info with calculated values
            train_info_output = {
                "route_code": route_code,
                "train_number": train_number,
                "driven_distance_km": driven_distance_km,
                "completed_timetable": completed_timetable
            }
            # Preserve other train_info fields if provided
            for key, value in train_info.items():
                if key not in train_info_output:
                    train_info_output[key] = value

            # Create completed schedules directory
            completed_dir = Path(__file__).parent / "timetable" / "completed"
            completed_dir.mkdir(parents=True, exist_ok=True)

            # Generate filename with current timestamp
            from datetime import datetime
            now = datetime.now()
            timestamp_str = now.strftime("%Y-%m-%d_%H-%M-%S")
            filename = f"{route_code}_{train_number}_{timestamp_str}.json"
            file_path = completed_dir / filename

            # Build output structure
            output = {
                "train_info": train_info_output,
                "service_started": {
                    "game_time": game_time_at_start,
                    "real_time": real_time_at_start
                },
                "service_completed": {
                    "timestamp": datetime.now().isoformat()
                },
                "schedule": schedule_data
            }

            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(output, f, indent=2, ensure_ascii=False)

                return jsonify({
                    "status": "ok",
                    "filename": filename,
                    "file_path": str(file_path),
                    "driven_distance_km": driven_distance_km
                })
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.app.route("/health")
        def health_check():
            """Health check endpoint"""
            return jsonify({
                "status": "healthy",
                "poller_running": self.api_poller.is_running,
                "game_status": self.api_poller.game_status
            })
    
    @staticmethod
    def _get_timestamp() -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().strftime("%H:%M:%S.%f")[:-3]
    
    def run(self, debug: bool = False):
        """
        Start the web server
        
        Args:
            debug: Whether to run in debug mode
        """
        if Config.DEBUG:
            print(f"\n[WebDashboard] Starting web server on http://{self.host}:{self.port}")
            print(f"[WebDashboard] Dashboard will be available at http://localhost:{self.port}")
            print(f"[WebDashboard] From other devices: http://<your-pc-ip>:{self.port}\n")
        
        self.app.run(
            host=self.host,
            port=self.port,
            debug=debug,
            use_reloader=False,  # Don't reload when files change (would cause issues with poller)
            threaded=True
        )
