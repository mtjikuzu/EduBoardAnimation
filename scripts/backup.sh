#!/usr/bin/env bash
# EduWhiteboard database backup script
# Usage: ./scripts/backup.sh [output-dir]

set -euo pipefail

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "=== EduWhiteboard Backup: $TIMESTAMP ==="

# Database backup (PostgreSQL)
if [ -n "${DATABASE_URL:-}" ]; then
  echo "Backing up database..."
  pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$BACKUP_DIR/eduwb-db-$TIMESTAMP.sql.gz"
  echo "  Database: $BACKUP_DIR/eduwb-db-$TIMESTAMP.sql.gz ($(du -h "$BACKUP_DIR/eduwb-db-$TIMESTAMP.sql.gz" | cut -f1))"
else
  echo "  SKIP: DATABASE_URL not set"
fi

# MinIO/S3 backup (if mc is installed)
if command -v mc &>/dev/null && [ -n "${MINIO_ENDPOINT:-}" ]; then
  echo "Backing up object storage..."
  mc alias set eduwb-minio "http://$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
  mc mirror eduwb-minio/eduwb-assets "$BACKUP_DIR/minio-assets-$TIMESTAMP/" --overwrite
  echo "  Assets: $BACKUP_DIR/minio-assets-$TIMESTAMP/"
else
  echo "  SKIP: MinIO client not configured"
fi

# Environment config backup
if [ -f .env ]; then
  cp .env "$BACKUP_DIR/eduwb-env-$TIMESTAMP.txt"
  echo "  Config: $BACKUP_DIR/eduwb-env-$TIMESTAMP.txt"
fi

echo "=== Backup complete ==="
echo "  To restore database: gunzip -c <file>.sql.gz | psql \$DATABASE_URL"
