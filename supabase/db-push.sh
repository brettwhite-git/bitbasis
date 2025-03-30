#!/bin/bash

# Load environment variables
set -a
source .env
set +a

# Set the specific variable Supabase CLI needs
export SUPABASE_DB_PASSWORD="$POSTGRES_PASSWORD"

# Run the push command with explicit password and include-all flag
SUPABASE_DB_PASSWORD='qkej2B@$VYXSa6PZs$7bxa30!ht7Pn' supabase db push --include-all 