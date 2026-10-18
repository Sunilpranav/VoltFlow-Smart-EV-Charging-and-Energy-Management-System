#!/usr/bin/env bash
# ==============================================================================
# Generate Self-Signed SSL Certificates for VoltFlow Local/Staging Testing
#
# Generates:
#   certs/server.crt
#   certs/server.key
# ==============================================================================

set -euo pipefail

CERT_DIR="./certs"
mkdir -p "${CERT_DIR}"

DOMAIN="${1:-localhost}"

echo "[INFO] Generating self-signed TLS certificates for domain: ${DOMAIN}..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "${CERT_DIR}/server.key" \
  -out "${CERT_DIR}/server.crt" \
  -subj "/C=US/ST=California/L=San Francisco/O=VoltFlow/CN=${DOMAIN}" \
  -addext "subjectAltName=DNS:${DOMAIN},DNS:*.${DOMAIN},IP:127.0.0.1"

chmod 600 "${CERT_DIR}/server.key"
chmod 644 "${CERT_DIR}/server.crt"

echo "[SUCCESS] Generated certificates in ${CERT_DIR}:"
echo "  - Private Key: ${CERT_DIR}/server.key"
echo "  - Certificate: ${CERT_DIR}/server.crt"
