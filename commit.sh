#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}Git Commit & Push Script${NC}\n"

# Check if commit message was provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a commit message${NC}"
    echo -e "${YELLOW}Usage: ./commit.sh \"Your commit message\"${NC}"
    exit 1
fi

COMMIT_MESSAGE="$1"

cd "$SCRIPT_DIR"

# Check if git repo exists
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Git repository not found. Initializing...${NC}"
    git init
    echo -e "${GREEN}Git repository initialized${NC}\n"
fi

# Add all files
echo -e "${BLUE}Adding all files...${NC}"
git add .

# Show status
echo -e "\n${BLUE}Git Status:${NC}"
git status --short

# Commit
echo -e "\n${BLUE}Creating commit...${NC}"
git commit -m "$COMMIT_MESSAGE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Commit created successfully${NC}\n"

    # Check if remote exists
    if git remote | grep -q 'origin'; then
        echo -e "${BLUE}Pushing to remote...${NC}"

        # Get current branch
        CURRENT_BRANCH=$(git branch --show-current)

        # Push
        git push origin "$CURRENT_BRANCH"

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Pushed to origin/$CURRENT_BRANCH successfully${NC}"
        else
            echo -e "${YELLOW}⚠ Push failed. You may need to set upstream branch:${NC}"
            echo -e "${YELLOW}Run: git push -u origin $CURRENT_BRANCH${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ No remote repository found${NC}"
        echo -e "${YELLOW}To add remote, run:${NC}"
        echo -e "${YELLOW}git remote add origin <your-repo-url>${NC}"
        echo -e "${YELLOW}git push -u origin main${NC}"
    fi
else
    echo -e "${RED}✗ Commit failed or nothing to commit${NC}"
fi

echo -e "\n${BLUE}Done!${NC}"
