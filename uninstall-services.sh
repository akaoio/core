#!/bin/bash

# Uninstall AKAO.IO Core systemd services

set -e

USER_HOME="$(eval echo ~$USER)"
CURRENT_USER="$USER"
SYSTEMD_USER_DIR="$USER_HOME/.config/systemd/user"

echo "🗑️  Uninstalling AKAO.IO Core systemd services..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please run this script as a regular user, not root"
    exit 1
fi

# Stop services if running
echo "🛑 Stopping services..."
systemctl --user stop akaoio-docs-watcher.service 2>/dev/null || echo "⚠️ Docs watcher service not running"
systemctl --user stop akaoio-core-startup.service 2>/dev/null || echo "⚠️ Core startup service not running"

# Disable services
echo "🔧 Disabling services..."
systemctl --user disable akaoio-docs-watcher.service 2>/dev/null || echo "⚠️ Docs watcher service not enabled"
systemctl --user disable akaoio-core-startup.service 2>/dev/null || echo "⚠️ Core startup service not enabled"

# Remove service files
echo "📋 Removing service files..."
rm -f "$SYSTEMD_USER_DIR/akaoio-docs-watcher.service"
rm -f "$SYSTEMD_USER_DIR/akaoio-core-startup.service"

# Reload systemd user daemon
echo "🔄 Reloading systemd user daemon..."
systemctl --user daemon-reload

# Disable lingering (optional)
echo "🔓 Disabling user lingering..."
sudo loginctl disable-linger "$CURRENT_USER" 2>/dev/null || {
    echo "⚠️ Could not disable lingering (requires sudo). This is not critical."
}

echo "✅ AKAO.IO Core services uninstalled successfully!"
echo "📝 Service files removed from: $SYSTEMD_USER_DIR"