#!/bin/bash

# Rename default branch to main
git branch -M main

# Initial commit
git add package.json package-lock.json vite.config.js index.html .gitignore eslint.config.js README.md
git commit -m "chore: switched to pure vanila js, html and css"

# Get all files except the ones we just added and exclude git/node_modules
# We'll put them in an array
mapfile -t FILES < <(find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -name "package.json" -not -name "package-lock.json" -not -name "vite.config.js" -not -name "index.html" -not -name ".gitignore" -not -name "eslint.config.js" -not -name "README.md" -not -name "create_commits.sh" | sort)

TOTAL_FILES=${#FILES[@]}
COMMITS_TARGET=48 # 50 total minus 2
FILES_PER_COMMIT=$(( TOTAL_FILES / COMMITS_TARGET ))
if [ $FILES_PER_COMMIT -eq 0 ]; then
  FILES_PER_COMMIT=1
fi

count=0
commit_count=1
batch=()

for file in "${FILES[@]}"; do
    batch+=("$file")
    count=$((count+1))
    
    if [ $count -eq $FILES_PER_COMMIT ]; then
        git add "${batch[@]}"
        git commit -m "feat: add $(basename "${batch[0]}") and related files"
        batch=()
        count=0
        commit_count=$((commit_count+1))
    fi
done

# Commit any remaining files
if [ ${#batch[@]} -gt 0 ]; then
    git add "${batch[@]}"
    git commit -m "chore: finalising remaining application files"
fi

echo "Created $commit_count commits."
