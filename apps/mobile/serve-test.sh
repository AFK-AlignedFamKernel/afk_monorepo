#!/bin/bash
cd "$(dirname "$0")"
echo "Starting simple HTTP server for testing..."
echo "Open http://localhost:8000/test-features.html in your browser"
python3 -m http.server 8000