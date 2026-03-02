Shell
#!/usr/bin/env bash
set -euo pipefail
# Ensure required env vars exist
: "${BITBUCKET_TAG:?BITBUCKET_TAG is required}"
: "${BITBUCKET_CLONE_DIR:?BITBUCKET_CLONE_DIR is required}"
: "${MKDOCS_FTP_NAME:?MKDOCS_FTP_NAME is required}"
: "${MKDOCS_FTP_PW:?MKDOCS_FTP_PW is required}"
: "${MKDOCS_FTP_SERVER:?MKDOCS_FTP_SERVER is required}"
echo "Deploying docs for $BITBUCKET_TAG"
# Detect LTS hotfix via changelog header: "## v3.15.1 (LTS)"
FIRST_HEADER="$(grep -m1 '^## ' CHANGELOG.md || true)"
echo "Detected changelog header: $FIRST_HEADER"
DEPLOY_LATEST=true
if [[ "$FIRST_HEADER" == *"(LTS)"* ]]; then
  VERSION="$(echo "$FIRST_HEADER" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || true)"
  PATCH="${VERSION##*.}"
  PATCH="${PATCH:-0}"
  if [[ "$PATCH" != "0" ]]; then
    echo "⏭️  LTS hotfix detected (patch=$PATCH) → do NOT deploy Latest"
    DEPLOY_LATEST=false
  else
    echo "✅ LTS release detected (patch=0) → deploy Latest"
  fi
else
  echo "✅ Non-LTS release → deploy Latest"
fi
# Build docs
mike deploy "$BITBUCKET_TAG"
# Prepare folders
rm -rf "$BITBUCKET_CLONE_DIR/$BITBUCKET_TAG" "$BITBUCKET_CLONE_DIR/Latest"
mv site "$BITBUCKET_CLONE_DIR/$BITBUCKET_TAG"
# Install lftp if not present (pipeline image python:3.8 usually doesn't have it)
if ! command -v lftp >/dev/null 2>&1; then
  apt-get update
  apt-get install -y lftp
fi
# Helper: upload directory to remote path
upload_dir () {
  local local_dir="$1"
  local remote_dir="$2"
  echo "Uploading: $local_dir  ->  $remote_dir"
  lftp -u "$MKDOCS_FTP_NAME","$MKDOCS_FTP_PW" "$MKDOCS_FTP_SERVER" <<EOF
set ftp:ssl-allow no
set net:max-retries 2
set net:timeout 20
mirror -R --verbose "$local_dir" "$remote_dir"
quit
EOF
}
# Versioned deploy (always)
upload_dir "$BITBUCKET_CLONE_DIR/$BITBUCKET_TAG" "/$BITBUCKET_TAG"
# Latest deploy (conditional)
if [[ "$DEPLOY_LATEST" == "true" ]]; then
#   cp -R "$BITBUCKET_CLONE_DIR/$BITBUCKET_TAG" "$BITBUCKET_CLONE_DIR/Latest"
#   upload_dir "$BITBUCKET_CLONE_DIR/Latest" "/Latest"
  echo "✅  Deploy Latest deployment"
else
  echo "⏭️  Skipping Latest deployment"
fi