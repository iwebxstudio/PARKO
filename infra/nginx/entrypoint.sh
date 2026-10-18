#!/bin/sh
set -e

# Generate self-signed certificates if they don't exist
CERT_DIR="/etc/nginx/certs"
mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_DIR/server.key" ] || [ ! -f "$CERT_DIR/server.crt" ]; then
    echo "SSL certificates not found. Generating default self-signed certificates..."
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout "$CERT_DIR/server.key" \
        -out "$CERT_DIR/server.crt" \
        -subj "/C=LA/L=Vientiane/O=PARKO/OU=IT/CN=localhost"
    echo "SSL certificates generated successfully."
else
    echo "SSL certificates already exist."
fi

# Execute CMD
exec "$@"
