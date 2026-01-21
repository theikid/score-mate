#!/bin/sh
set -e

# Display version on container startup
if [ -n "$APP_VERSION" ]; then
  echo "🚀 ScoreMate $APP_VERSION starting..."
else
  echo "🚀 ScoreMate starting..."
fi

# Execute the main command
exec "$@"
