import http.server
import socketserver
import os
from pathlib import Path
import sys
from urllib.parse import urlparse
import mimetypes

PORT = 8000
PUBLIC_DIR = Path("public").resolve()  # Resolve path immediately


class SPAHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Ensure PUBLIC_DIR exists (using the resolved path)
        if not PUBLIC_DIR.is_dir():
            print(f"Error: Public directory '{PUBLIC_DIR}' not found.", file=sys.stderr)
            # It's better to raise an error or exit if the dir is critical
            # super() call might fail anyway if directory is None implicitly
        # Pass the resolved absolute path string to the base class constructor
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def do_GET(self):
        try:
            # Parse the URL to separate path and query string
            parsed_url = urlparse(self.path)
            request_path = parsed_url.path.lstrip("/")

            # Construct the full filesystem path
            fs_path = (PUBLIC_DIR / request_path).resolve()

            # Security check: Ensure the path is still within the public directory
            if not str(fs_path).startswith(str(PUBLIC_DIR)):
                self.send_error(403, "Forbidden")
                return

            # Check if the requested path (without query) exists on the filesystem
            # If it doesn't exist, or if it's a directory (let base handler serve index.html from dir),
            # modify self.path to serve the SPA's index.html as a fallback.
            if not fs_path.exists() or fs_path.is_dir():
                # Check if it looks like an API or file request that failed
                # Simple check: does it have a file extension?
                _, ext = os.path.splitext(fs_path)
                if ext:  # It has an extension, likely a file request that failed
                    # Let the base handler generate the 404
                    pass  # Don't modify self.path
                else:
                    # It looks like a route, serve index.html
                    self.path = "/index.html"
                    fs_path = (
                        PUBLIC_DIR / "index.html"
                    ).resolve()  # Update fs_path for potential MIME check

            # Let the base handler try to serve the file (original path or index.html)
            # It will handle 404s for files with extensions that don't exist.
            return super().do_GET()

        except Exception as e:
            print(f"Error handling GET request for {self.path}: {e}", file=sys.stderr)
            self.send_error(500, "Internal Server Error")

    # Optional: Override guess_type for better MIME handling if needed,
    # though SimpleHTTPRequestHandler usually handles common types.
    # def guess_type(self, path):
    #     # Custom MIME type logic if necessary
    #     base, ext = posixpath.splitext(path)
    #     if ext in self.extensions_map:
    #         return self.extensions_map[ext]
    #     ext = ext.lower()
    #     if ext in self.extensions_map:
    #         return self.extensions_map[ext]
    #     else:
    #         return self.extensions_map['']


if __name__ == "__main__":
    # Ensure PUBLIC_DIR exists before starting the server
    if not PUBLIC_DIR.is_dir():
        print(
            f"Fatal Error: Public directory '{PUBLIC_DIR}' does not exist.",
            file=sys.stderr,
        )
        sys.exit(1)

    # Make sure mimetypes knows about common web types
    mimetypes.add_type("application/javascript", ".js")
    mimetypes.add_type("text/css", ".css")
    mimetypes.add_type("application/json", ".json")
    mimetypes.add_type("image/webp", ".webp")
    mimetypes.add_type("font/woff2", ".woff2")

    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), SPAHttpRequestHandler)

    print(f"Serving HTTP from '{PUBLIC_DIR}' on http://localhost:{PORT} ...")
    print("SPA Fallback: Enabled (routes without extensions to /index.html)")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()
    except OSError as e:
        print(f"\nCould not start server on port {PORT}: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\nServer error: {e}", file=sys.stderr)
    finally:
        # Ensure shutdown happens even on unexpected errors
        httpd.server_close()  # Use server_close before shutdown for cleaner socket closing
        httpd.shutdown()
        sys.exit(0)
