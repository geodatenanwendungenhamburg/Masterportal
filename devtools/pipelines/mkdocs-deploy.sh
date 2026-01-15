#!/usr/bin/env bash
chmod +x masterportal/deployScripts/transfer_ftp.sh
chmod -R a+rwx masterportal/dist

set -e

BITBUCKET_TAG=${BITBUCKET_TAG:-v3.19.0}

echo "Deploying docs for $BITBUCKET_TAG"

FIRST_HEADER=$(grep -m1 '^## ' CHANGELOG.md || true)
echo "Detected changelog header: $FIRST_HEADER"

DEPLOY_LATEST=true

if [[ "$FIRST_HEADER" == *"(LTS)"* ]]; then
  PATCH=$(echo "$FIRST_HEADER" | grep -oE 'v[0-9]+\.[0-9]+\.([0-9]+)' | cut -d. -f3)
  if [[ "$PATCH" != "0" ]]; then
    echo "❌ LTS hotfix detected → do NOT deploy Latest"
    DEPLOY_LATEST=false
  fi
fi

# Build docs
mike deploy "$BITBUCKET_TAG"

# Versioned deploy (always)
mv site "$BITBUCKET_TAG"

echo "Uploading versioned docs: $BITBUCKET_TAG"
pipe_output=$(cat <<EOF
USER=$MKDOCS_FTP_NAME
PASSWORD=$MKDOCS_FTP_PW
SERVER=$MKDOCS_FTP_SERVER
REMOTE_PATH=/$BITBUCKET_TAG
LOCAL_PATH=$BITBUCKET_CLONE_DIR/$BITBUCKET_TAG
DEBUG=true
DELETE_FLAG=false
EOF
)

# Latest deploy (conditional)
if [ "$DEPLOY_LATEST" = "true" ]; then
  echo "✅ Deploying Latest"
  cp -r "$BITBUCKET_TAG" Latest
else
  echo "⏭️ Skipping Latest deployment"
fi
