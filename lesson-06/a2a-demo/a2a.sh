#!/usr/bin/env bash
# Send one JSON-RPC request file to the Flight Agent.
curl -s http://localhost:4001/a2a/jsonrpc \
  -H 'content-type: application/json' \
  -H 'A2A-Version: 1.0' \
  -d "@$1"
