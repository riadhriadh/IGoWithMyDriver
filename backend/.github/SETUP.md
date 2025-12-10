# 🔐 GitHub Actions Setup Guide

Complete setup instructions for GitHub Actions CI/CD pipeline.

## Prerequisites

- GitHub repository with admin access
- Git installed and configured
- GitHub CLI installed (`gh`)

---

## Step 1: Fork/Create Repository

```bash
# Clone repository
git clone https://github.com/owner/repo.git
cd repo

# Verify .github/workflows directory exists
ls -la .github/workflows/
```

---

## Step 2: Create Required Secrets

### 2.1 Generate GitHub Token

```bash
# Using GitHub CLI
gh auth login
gh auth token
```

**Or via GitHub UI**:
1. Go to Settings → Developer settings → Personal access tokens
2. Generate new token with scopes:
   - `repo` (full repository access)
   - `workflow` (manage workflows)
   - `write:packages` (write to packages)

### 2.2 Generate Docker Registry Credentials

**For GitHub Container Registry (GHCR)**:
```bash
# Use GitHub token with these scopes:
# - write:packages
# - read:packages

# Create PAT (Personal Access Token)
gh secret set REGISTRY_PASSWORD --body "ghp_xxx"
```

**For Docker Hub**:
```bash
# Create access token at https://hub.docker.com/settings/security
gh secret set DOCKER_USERNAME --body "username"
gh secret set DOCKER_PASSWORD --body "dckr_xxx"
```

---

## Step 3: Add Required Secrets

### 3.1 Database Credentials

```bash
# MongoDB URI (for testing)
gh secret set MONGODB_URI --body "mongodb://root:password@localhost:27017/taxi-vtc-test"

# MongoDB production URI
gh secret set PROD_MONGODB_URI --body "mongodb+srv://user:pass@cluster.mongodb.net/taxi-vtc"

# Redis URL
gh secret set REDIS_URL --body "redis://localhost:6379"
gh secret set PROD_REDIS_URL --body "redis://prod-server:6379"
```

### 3.2 JWT Configuration

```bash
# JWT Secret (generate random)
# On Linux/Mac:
# openssl rand -base64 32
# On Windows PowerShell:
# [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString())) | Out-File jwt-secret.txt

gh secret set JWT_SECRET --body "base64-encoded-random-string"
gh secret set JWT_EXPIRATION --body "7d"
```

### 3.3 Deployment Credentials

```bash
# SSH Deploy Key
gh secret set DEPLOY_KEY --body "$(cat ~/.ssh/id_rsa)"

# Staging Server
gh secret set STAGING_HOST --body "staging.example.com"
gh secret set STAGING_USER --body "deploy"
gh secret set STAGING_PORT --body "22"

# Production Server
gh secret set PROD_HOST --body "prod.example.com"
gh secret set PROD_USER --body "deploy"
gh secret set PROD_PORT --body "22"
```

### 3.4 Notification Credentials

```bash
# Slack Webhook URL
# Create at: https://api.slack.com/messaging/webhooks
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
```

### 3.5 Security & Monitoring Tools

```bash
# Snyk Token
# Get from: https://app.snyk.io/account/settings
gh secret set SNYK_TOKEN --body "snyk_token_xxx"

# SonarQube Token
# Get from: https://sonarcloud.io/account/security
gh secret set SONAR_TOKEN --body "squ_xxx"
gh secret set SONAR_PROJECT_KEY --body "owner_repo"
gh secret set SONAR_ORGANIZATION --body "your-org"

# Codecov Token (optional)
gh secret set CODECOV_TOKEN --body "codecov_xxx"
```

### 3.6 AWS/Cloud Credentials (if using cloud deployment)

```bash
# AWS
gh secret set AWS_ACCESS_KEY_ID --body "AKIA..."
gh secret set AWS_SECRET_ACCESS_KEY --body "aws_secret_xxx"
gh secret set AWS_REGION --body "eu-west-1"
gh secret set AWS_ECR_REGISTRY --body "123456789.dkr.ecr.eu-west-1.amazonaws.com"

# DigitalOcean
gh secret set DIGITALOCEAN_TOKEN --body "dop_xxx"
gh secret set DIGITALOCEAN_REGISTRY_URL --body "registry.digitalocean.com"
```

---

## Step 4: Verify Secrets

```bash
# List all secrets
gh secret list

# Expected output:
# CODECOV_TOKEN
# DEPLOY_KEY
# DOCKER_PASSWORD
# DOCKER_USERNAME
# JWT_SECRET
# MONGODB_URI
# PROD_HOST
# PROD_MONGODB_URI
# PROD_REDIS_URL
# PROD_USER
# REGISTRY_PASSWORD
# SLACK_WEBHOOK_URL
# SNYK_TOKEN
# SONAR_TOKEN
# STAGING_HOST
# STAGING_USER
```

---

## Step 5: Configure GitHub Repository

### 5.1 Enable Actions

1. Go to repository Settings
2. Select "Actions" → "General"
3. Enable "Allow all actions and reusable workflows"
4. Click "Save"

### 5.2 Set Up Branch Protection

```bash
# For main branch
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT \
  -f required_status_checks='{"strict":true,"contexts":["test (18.x)","test (20.x)","build","security"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
  -f allow_force_pushes=false \
  -f allow_deletions=false
```

**Or via UI**:
1. Settings → Branches
2. Click "Add rule"
3. Pattern: `main`
4. Enable:
   - Require pull request reviews
   - Dismiss stale reviews
   - Require status checks to pass
   - Require branches up to date
   - Include administrators

### 5.3 Configure Environments

```bash
# Staging Environment
gh environment create staging

# Production Environment
gh environment create production
```

**Configure Staging**:
1. Settings → Environments → staging
2. Add environment secrets:
   - `DEPLOY_HOST`: staging.example.com
   - `DEPLOY_USER`: deploy
   - `APP_URL`: https://api.staging.example.com

**Configure Production**:
1. Settings → Environments → production
2. Add environment secrets:
   - `DEPLOY_HOST`: prod.example.com
   - `DEPLOY_USER`: deploy
   - `APP_URL`: https://api.prod.example.com
3. Enable "Required reviewers"
4. Add reviewers (maintainers)

---

## Step 6: Configure Monitoring Tools

### 6.1 Codecov Integration

1. Go to https://codecov.io
2. Sign in with GitHub
3. Enable repository
4. Get token from Settings
5. Add to secrets: `gh secret set CODECOV_TOKEN`

### 6.2 SonarQube Integration

1. Go to https://sonarcloud.io
2. Create organization
3. Add project
4. Get tokens from "Settings"
5. Add to secrets:
   ```bash
   gh secret set SONAR_TOKEN
   gh secret set SONAR_PROJECT_KEY
   gh secret set SONAR_ORGANIZATION
   ```

### 6.3 Snyk Integration

1. Go to https://app.snyk.io
2. Sign in with GitHub
3. Get API token from Account Settings
4. Add to secrets: `gh secret set SNYK_TOKEN`

---

## Step 7: Configure Deployment Servers

### 7.1 Setup SSH Keys

**Generate key** (if not exists):
```bash
# Linux/Mac
ssh-keygen -t rsa -b 4096 -f ~/.ssh/deploy_key -N ""

# Windows PowerShell (requires OpenSSH)
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\deploy_key" -N ""
```

**Add to GitHub**:
```bash
# Copy private key
gh secret set DEPLOY_KEY --body "$(cat ~/.ssh/deploy_key)"

# Add public key to server
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@server.example.com
```

### 7.2 Setup Server

**On staging/production server**:

```bash
# Create deploy user
sudo useradd -m -s /bin/bash deploy

# Setup SSH
sudo -u deploy mkdir -p ~/.ssh
sudo -u deploy chmod 700 ~/.ssh

# Add deploy key
echo "ssh-rsa AAAA..." | sudo tee -a ~deploy/.ssh/authorized_keys
sudo chmod 600 ~deploy/.ssh/authorized_keys
sudo chown deploy:deploy ~deploy/.ssh/authorized_keys

# Test connection
ssh -i deploy_key deploy@server.example.com "echo 'Connection OK'"
```

### 7.3 Setup Application Directory

```bash
# On server
sudo mkdir -p /var/www/app
sudo chown deploy:deploy /var/www/app
sudo chmod 755 /var/www/app

# Setup logs
sudo mkdir -p /var/log/app
sudo chown deploy:deploy /var/log/app

# Setup systemd service
sudo tee /etc/systemd/system/app.service > /dev/null <<EOF
[Unit]
Description=Taxi VTC App
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/app
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/app/app.log
StandardError=append:/var/log/app/app.log

[Install]
WantedBy=multi-user.target
EOF

# Enable service
sudo systemctl enable app
```

---

## Step 8: Test Workflows

### 8.1 Test CI Workflow

```bash
# Push to develop branch
git checkout develop
git commit --allow-empty -m "Test CI workflow"
git push origin develop

# Go to Actions tab and verify CI runs
```

### 8.2 Test Quality Workflow

```bash
# Create feature branch
git checkout -b feature/test-quality
git commit --allow-empty -m "Test quality workflow"
git push origin feature/test-quality

# Create pull request
gh pr create --title "Test Quality Workflow" --body "Testing quality checks"

# Verify workflow runs and comments on PR
```

### 8.3 Test Docker Workflow

```bash
# Docker workflow runs on all branches
# Push to develop to test
git push origin develop

# Check Actions tab for Docker workflow
# Verify image pushed to GHCR
```

### 8.4 Test CD Workflow

```bash
# Create tag to trigger release
git tag v0.1.0
git push origin v0.1.0

# Verify deployment to production
curl https://api.prod.example.com/health
```

---

## Step 9: Configure Slack Notifications

### 9.1 Create Slack Webhook

1. Go to Slack workspace
2. Create app at https://api.slack.com/apps
3. Enable "Incoming Webhooks"
4. Click "Add New Webhook to Workspace"
5. Select channel (e.g., #deployments)
6. Copy webhook URL

### 9.2 Add to GitHub

```bash
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/..."
```

### 9.3 Test Webhook

```bash
# Test locally
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-type: application/json' \
  -d '{
    "text": "GitHub Actions Test",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Test Message*\nGitHub Actions is working!"
        }
      }
    ]
  }'
```

---

## Step 10: Documentation

### 10.1 Update README

Add badge to `README.md`:

```markdown
# Taxi VTC Backend

![CI - Tests & Linting](https://github.com/owner/repo/actions/workflows/ci.yml/badge.svg)
![Docker Build & Push](https://github.com/owner/repo/actions/workflows/docker.yml/badge.svg)
![Code Quality](https://github.com/owner/repo/actions/workflows/quality.yml/badge.svg)

## CI/CD Pipeline

This project uses GitHub Actions for automated testing and deployment.

See [.github/WORKFLOWS.md](.github/WORKFLOWS.md) for details.
```

### 10.2 Document Workflows

Reference files:
- `.github/WORKFLOWS.md` - Workflow documentation
- `.github/SECRETS.md` - Secrets configuration
- `.github/TROUBLESHOOTING.md` - Troubleshooting guide

---

## Verification Checklist

- [ ] All secrets configured
- [ ] GitHub token created and stored
- [ ] Docker registry credentials set
- [ ] Database credentials configured
- [ ] Deployment servers set up
- [ ] SSH keys configured
- [ ] Branch protection rules enabled
- [ ] Environments configured
- [ ] Monitoring tools integrated
- [ ] Slack webhook tested
- [ ] Workflows triggered and passing
- [ ] CI passes on PRs
- [ ] CD deploys to staging/production
- [ ] Docker images built and pushed
- [ ] Quality checks passing
- [ ] Releases created with tags

---

## Common Tasks

### Add New Secret

```bash
gh secret set SECRET_NAME --body "value"
```

### Update Secret

```bash
gh secret set SECRET_NAME --body "new-value"
```

### List All Secrets

```bash
gh secret list
```

### Remove Secret

```bash
gh secret delete SECRET_NAME
```

### View Workflow Status

```bash
# List recent workflow runs
gh run list --workflow=ci.yml

# View specific run
gh run view RUN_ID

# View logs
gh run view RUN_ID --log
```

### Manually Trigger Workflow

```bash
# Using GitHub CLI
gh workflow run cd.yml -f environment=staging

# Or via GitHub UI:
# Actions → CD workflow → Run workflow
```

---

## Environment-Specific Configuration

### Development (develop branch)

```bash
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/taxi-vtc-dev
REDIS_URL=redis://localhost:6379/0
LOG_LEVEL=debug
```

### Staging

```bash
NODE_ENV=staging
MONGODB_URI=mongodb+srv://user:pass@staging.mongodb.net/taxi-vtc
REDIS_URL=redis://staging-server:6379
LOG_LEVEL=info
```

### Production

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@prod.mongodb.net/taxi-vtc
REDIS_URL=redis://prod-server:6379
LOG_LEVEL=warn
```

---

## Maintenance

### Weekly Tasks
- [ ] Review workflow runs
- [ ] Check for failed jobs
- [ ] Update dependencies

### Monthly Tasks
- [ ] Rotate secrets/tokens
- [ ] Review security scans
- [ ] Update documentation

### Quarterly Tasks
- [ ] Review GitHub Actions pricing
- [ ] Optimize workflow performance
- [ ] Update base Docker images

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: Ready for Setup
