# Deployment Guide to GitHub

## Step 1: Initialize Git Repository

```bash
cd "/Volumes/MKDrive/Websites/Pesa/React App/ecommerce-platform-complete/ecommerce-platform"
git init
```

## Step 2: Add All Files

```bash
git add .
```

## Step 3: Create Initial Commit

```bash
git commit -m "Initial commit: E-commerce platform with admin panel, frontend, and backend"
```

## Step 4: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository (e.g., `ecommerce-platform` or `pesashop-admin`)
5. Choose Public or Private
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 5: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Replace YOUR_USERNAME and YOUR_REPO_NAME with your actual GitHub username and repository name
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 6: Verify

Check your GitHub repository - all files should be uploaded.

## Future Updates

To push future changes:

```bash
git add .
git commit -m "Your commit message describing the changes"
git push
```

## Important Notes

- The `.gitignore` file will prevent sensitive files (like `.env`, `node_modules`, etc.) from being uploaded
- Make sure to set up environment variables separately (don't commit `.env` files)
- If you need to add environment variable examples, create `.env.example` files
