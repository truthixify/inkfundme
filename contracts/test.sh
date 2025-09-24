#!/usr/bin/env bash
set -eu

# ENVIRONMENT VARIABLES
CONTRACTS_DIR="${CONTRACTS_DIR:=./src}" # Base contract directory 
DIR="${DIR:=./deployments}" # Output directory for build files

# Copy command helper (cross-platform)
CP_CMD=$(command -v cp &> /dev/null && echo "cp" || echo "copy")

# Determine all contracts under `$CONTRACTS_DIR`
contracts=($(find $CONTRACTS_DIR -maxdepth 1 -type d -exec test -f {}/Cargo.toml \; -print | xargs -n 1 basename))

# Test all contracts
for i in "${contracts[@]}"
do
  echo -e "\nTesting '$CONTRACTS_DIR/$i/Cargo.toml'…"
  (cd $CONTRACTS_DIR/$i && pop test)
  # cargo test --manifest-path $CONTRACTS_DIR/$i/Cargo.toml
done