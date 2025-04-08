#!/bin/bash

# Script to deploy the update-price Supabase Edge Function
# Make sure you have the Supabase CLI installed and are logged in

# Set project reference
PROJECT_REF="npcvbxrshuflujcnikon"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deploying update-price Supabase Edge Function...${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: supabase CLI is not installed.${NC}"
    echo "Please install it by running: npm install -g supabase"
    exit 1
fi

# Deploy the function
supabase functions deploy update-price --project-ref $PROJECT_REF

# Check deployment result
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Edge function deployed successfully!${NC}"
    echo -e "${YELLOW}Function URL:${NC} https://$PROJECT_REF.supabase.co/functions/v1/update-price"
    echo -e "${YELLOW}Test the function with:${NC} curl -X POST https://$PROJECT_REF.supabase.co/functions/v1/update-price -H \"Authorization: Bearer ANON_KEY\""
else
    echo -e "${RED}Deployment failed.${NC}"
    exit 1
fi

echo -e "${GREEN}Done!${NC}" 