#!/bin/bash

# Install AKAO.IO Core systemd services for auto-startup and docs watching

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER_HOME="$(eval echo ~$USER)"
CURRENT_USER="$USER"

echo "🚀 Installing AKAO.IO Core systemd services..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please run this script as a regular user, not root"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "$SCRIPT_DIR/watch-docs.cjs" ]; then
    echo "❌ watch-docs.cjs not found. Please run from /home/x/core directory"
    exit 1
fi

# Create systemd user directory if it doesn't exist
SYSTEMD_USER_DIR="$USER_HOME/.config/systemd/user"
mkdir -p "$SYSTEMD_USER_DIR"

echo "📁 Created systemd user directory: $SYSTEMD_USER_DIR"

# Copy service files and substitute user
echo "📋 Installing service files..."

# Install docs watcher service
sed "s|/home/x/core|$SCRIPT_DIR|g; s|%i|$CURRENT_USER|g" \
    "$SCRIPT_DIR/systemd/akaoio-docs-watcher.service" > \
    "$SYSTEMD_USER_DIR/akaoio-docs-watcher.service"

# Install startup service  
sed "s|/home/x/core|$SCRIPT_DIR|g; s|%i|$CURRENT_USER|g" \
    "$SCRIPT_DIR/systemd/akaoio-core-startup.service" > \
    "$SYSTEMD_USER_DIR/akaoio-core-startup.service"

echo "✅ Service files installed to $SYSTEMD_USER_DIR"

# Reload systemd user daemon
echo "🔄 Reloading systemd user daemon..."
systemctl --user daemon-reload

# Enable services
echo "🔧 Enabling services..."
systemctl --user enable akaoio-docs-watcher.service
systemctl --user enable akaoio-core-startup.service

# Enable lingering for the user (allows user services to run without login)
echo "🔒 Enabling user lingering..."
sudo loginctl enable-linger "$CURRENT_USER" || {
    echo "⚠️ Could not enable lingering (requires sudo). Services will only run when user is logged in."
}

echo "🎉 AKAO.IO Core services installed successfully!"
echo ""
echo "📋 Available commands:"
echo "  systemctl --user start akaoio-docs-watcher    # Start docs watcher"
echo "  systemctl --user stop akaoio-docs-watcher     # Stop docs watcher"  
echo "  systemctl --user status akaoio-docs-watcher   # Check watcher status"
echo "  systemctl --user restart akaoio-docs-watcher  # Restart watcher"
echo ""
echo "  systemctl --user start akaoio-core-startup    # Manual startup"
echo "  systemctl --user status akaoio-core-startup   # Check startup status"
echo ""
echo "📝 View logs:"
echo "  journalctl --user -u akaoio-docs-watcher -f   # Follow watcher logs"
echo "  journalctl --user -u akaoio-core-startup      # View startup logs"
echo ""
echo "🚀 Starting services now..."

# Start the services
systemctl --user start akaoio-core-startup
systemctl --user start akaoio-docs-watcher

echo "✅ Services started! Documentation watcher is now active."
echo "🔍 Check status: systemctl --user status akaoio-docs-watcher"