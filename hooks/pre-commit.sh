#/bin/bash

FILE="CHANGELOG.md"
echo "works"
if [ -f "$FILE" ]; then
  sed -i 's/Issue #/Issue \\#/g' "$FILE"
  git add "$FILE"
fi
