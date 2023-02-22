#!/usr/bin/env sh

cat <<EOF > "$(bazel info workspace)/.bazelrc"
build --sandbox_writable_path="$HOME/.cache/prisma"
EOF
