#!/bin/bash

# Integration script to add Doc Time services to existing start/stop control instances
# This script modifies the existing dial a drink start/stop scripts to include Doc Time

set -e

CONTROL_INSTANCE_START_SCRIPT="${CONTROL_START_SCRIPT:-/path/to/start-all-services.sh}"
CONTROL_INSTANCE_STOP_SCRIPT="${CONTROL_STOP_SCRIPT:-/path/to/stop-all-services.sh}"

echo "🔧 Integrating Doc Time services into start/stop control instances..."

# Check if scripts exist
if [ ! -f "$CONTROL_INSTANCE_START_SCRIPT" ]; then
  echo "⚠️  Start script not found at $CONTROL_INSTANCE_START_SCRIPT"
  echo "Creating example integration..."
  
  cat > cloud/start-all-services-example.sh << 'EOF'
#!/bin/bash
# Start all services (Dial a Drink + Doc Time)

# Start Dial a Drink services
/path/to/dial-a-drink/cloud/start-services.sh

# Start Doc Time services
/path/to/doc-time/cloud/start-services.sh

echo "✅ All services started"
EOF

  cat > cloud/stop-all-services-example.sh << 'EOF'
#!/bin/bash
# Stop all services (Dial a Drink + Doc Time)

# Stop Dial a Drink services
/path/to/dial-a-drink/cloud/stop-services.sh

# Stop Doc Time services
/path/to/doc-time/cloud/stop-services.sh

echo "✅ All services stopped"
EOF

  echo "📝 Example scripts created at:"
  echo "   - cloud/start-all-services-example.sh"
  echo "   - cloud/stop-all-services-example.sh"
  echo ""
  echo "Copy these to your control instances and update paths."
else
  # Add Doc Time to existing scripts
  echo "Adding Doc Time to existing start script..."
  if ! grep -q "doc-time" "$CONTROL_INSTANCE_START_SCRIPT"; then
    echo "" >> "$CONTROL_INSTANCE_START_SCRIPT"
    echo "# Start Doc Time services" >> "$CONTROL_INSTANCE_START_SCRIPT"
    echo "$(pwd)/cloud/start-services.sh" >> "$CONTROL_INSTANCE_START_SCRIPT"
    echo "✅ Added Doc Time to start script"
  else
    echo "⚠️  Doc Time already in start script"
  fi

  echo "Adding Doc Time to existing stop script..."
  if ! grep -q "doc-time" "$CONTROL_INSTANCE_STOP_SCRIPT"; then
    echo "" >> "$CONTROL_INSTANCE_STOP_SCRIPT"
    echo "# Stop Doc Time services" >> "$CONTROL_INSTANCE_STOP_SCRIPT"
    echo "$(pwd)/cloud/stop-services.sh" >> "$CONTROL_INSTANCE_STOP_SCRIPT"
    echo "✅ Added Doc Time to stop script"
  else
    echo "⚠️  Doc Time already in stop script"
  fi
fi

echo ""
echo "✅ Integration complete!"
echo ""
echo "📋 Manual Integration Steps:"
echo "1. Copy cloud/start-services.sh to your start control instance"
echo "2. Copy cloud/stop-services.sh to your stop control instance"
echo "3. Add the following to your start-all-services.sh:"
echo "   $(pwd)/cloud/start-services.sh"
echo "4. Add the following to your stop-all-services.sh:"
echo "   $(pwd)/cloud/stop-services.sh"
echo "5. Set GCP_PROJECT_ID environment variable on control instances"

