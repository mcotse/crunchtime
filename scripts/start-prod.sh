#!/bin/bash
set -e

export DB_PATH=/Users/mcotse/Developer/crunchtime/crunchtime.db
export CF_TEAM_DOMAIN=<your-team-name>
export PORT=4000

echo "Starting Crunchtime server..."
node /Users/mcotse/Developer/crunchtime/dist/server/index.js &
SERVER_PID=$!

echo "Starting Cloudflare tunnel..."
cloudflared tunnel --config ~/.cloudflared/crunchtime.yml run crunchtime &
TUNNEL_PID=$!

echo "Server PID: $SERVER_PID | Tunnel PID: $TUNNEL_PID"
echo "Press Ctrl+C to stop both"

trap "kill $SERVER_PID $TUNNEL_PID" SIGINT SIGTERM
wait
