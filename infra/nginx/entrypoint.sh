#!/bin/sh
set -e

# ສ້າງໃບຢັ້ງຢືນຄວາມປອດໄພ SSL ແບບ Self-signed ອັດຕະໂນມັດ ຖ້າຍັງບໍ່ທັນມີຢູ່ໃນລະບົບ ເພື່ອຮອງຮັບ HTTPS
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

# ສົ່ງຕໍ່ຄຳສັ່ງຫຼັກ (CMD) ເພື່ອ Run Nginx Service ຕໍ່ໄປ
exec "$@"
