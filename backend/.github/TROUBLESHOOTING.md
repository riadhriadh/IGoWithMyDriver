# 🔧 GitHub Actions Troubleshooting Guide

Common issues and solutions for CI/CD workflows.

## Table of Contents
1. [CI Workflow Issues](#ci-workflow-issues)
2. [CD Workflow Issues](#cd-workflow-issues)
3. [Docker Workflow Issues](#docker-workflow-issues)
4. [Quality Workflow Issues](#quality-workflow-issues)
5. [Release Workflow Issues](#release-workflow-issues)
6. [General Issues](#general-issues)

---

## CI Workflow Issues

### ❌ Tests Failing Locally but Passing in CI

**Symptom**: Tests pass in CI but fail on local machine

**Causes**:
- Different Node.js version
- Environment variables missing
- MongoDB/Redis not running
- Database state issues

**Solutions**:
```bash
# Install exact Node.js version used in CI
nvm use 20  # Match CI version

# Set test environment
$env:NODE_ENV = "test"
$env:MONGODB_URI = "mongodb://root:password@localhost:27017/taxi-vtc-test"
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"

# Clear database
npm run db:drop
npm run db:seed

# Run tests
npm run test
```

**Check**:
- Node.js version: `node --version`
- MongoDB running: `mongo --version`
- Redis running: `redis-cli ping`

---

### ❌ Tests Failing in CI but Passing Locally

**Symptom**: Tests pass locally but fail in GitHub Actions

**Causes**:
- Race conditions in CI environment
- Timing differences
- Environment variable case sensitivity
- Database state between tests

**Solutions**:
```bash
# Run tests with verbose output
npm run test -- --verbose --detectOpenHandles

# Run single test file
npm run test -- path/to/test.spec.ts

# Run with coverage
npm run test:cov -- --detectOpenHandles
```

**Check workflow logs**:
1. Go to Actions → CI workflow run
2. Expand "Run tests" step
3. Look for:
   - Timeout errors
   - Connection errors
   - Assertion failures

---

### ❌ ESLint Errors in PR

**Symptom**: PR fails linting check

**Causes**:
- Code style violations
- Unused variables
- Import issues
- Rule violations

**Solutions**:
```bash
# Check for lint errors
npm run lint

# Fix lint errors automatically
npm run lint:fix

# Check specific file
npm run lint -- src/app.module.ts
```

**Common fixes**:
- Remove unused imports
- Fix indentation
- Add missing semicolons
- Remove console logs

---

### ❌ Coverage Falling Below Threshold

**Symptom**: Coverage not uploaded to Codecov

**Causes**:
- Coverage below 80% threshold
- Coverage file not generated
- Codecov token missing

**Solutions**:
```bash
# Generate coverage report
npm run test:cov

# Check coverage summary
cat coverage/coverage-summary.json

# View coverage details
npm run test:cov -- --collectCoverageFrom="src/**/*.ts"
```

**Fix**:
1. Add tests for uncovered lines
2. Mark untestable code with `/* istanbul ignore */`
3. Update threshold in `jest.config.js`

---

### ❌ Gherkin/BDD Tests Failing

**Symptom**: Feature tests fail in CI

**Causes**:
- Cucumber steps not implemented
- Step definitions missing
- Hooks not executing
- Test data not available

**Solutions**:
```bash
# Run Gherkin tests with details
npm run test:gherkin -- --publish-quiet --format progress

# Run specific feature
npm run test:gherkin -- features/auth.feature

# Run with debugging
npm run test:gherkin -- --require features/step_definitions --backtrace
```

**Check**:
1. Step definitions in `features/step_definitions/`
2. Feature files syntax in `features/`
3. Hooks in `features/support/hooks.ts`

---

## CD Workflow Issues

### ❌ Deployment Fails with Authentication Error

**Symptom**: "Error: permission denied" during deploy

**Causes**:
- `DEPLOY_KEY` missing or incorrect
- `DEPLOY_TOKEN` expired
- SSH key not added to server

**Solutions**:
```bash
# Verify secret is set
gh secret list

# Update deploy key
gh secret set DEPLOY_KEY < ~/.ssh/id_rsa

# Test SSH connection
ssh -i deploy_key user@server "echo 'Connection OK'"
```

---

### ❌ Docker Login Fails

**Symptom**: "Error: authentication failed" when pushing Docker image

**Causes**:
- `GITHUB_TOKEN` incorrect
- `REGISTRY_USERNAME` missing
- `REGISTRY_PASSWORD` expired

**Solutions**:
```bash
# Check credentials
gh secret list | grep -E "REGISTRY|DOCKER"

# Update credentials
gh secret set REGISTRY_PASSWORD --body "new-token"

# Test login locally
echo $REGISTRY_PASSWORD | docker login -u $REGISTRY_USERNAME --password-stdin ghcr.io
```

---

### ❌ Deployment Timeout

**Symptom**: Deployment hangs and times out after 10 minutes

**Causes**:
- Application startup slow
- Database migrations failing
- Health check failing
- Network connectivity issues

**Solutions**:
```bash
# Check application startup time
npm run build
npm run start  # Time this

# Verify environment variables in server
echo $DATABASE_URL
echo $REDIS_URL

# Check logs on server
ssh user@server "tail -f /var/log/app.log"

# Test health endpoint
curl https://api.prod.example.com/health
```

**Fix**:
1. Optimize application startup
2. Pre-warm caches
3. Increase timeout in CD workflow
4. Check database availability

---

### ❌ Rollback Fails

**Symptom**: Deployment fails and rollback doesn't work

**Causes**:
- Previous version not available
- Rollback script has errors
- Database migrations not reversible

**Solutions**:
```bash
# Check available versions
ssh user@server "ls -la /opt/app/versions/"

# Manual rollback
ssh user@server "cd /opt/app && git checkout main && npm ci && npm run build && npm run start"

# Check deployment status
ssh user@server "systemctl status app"
```

---

### ❌ Slack Notification Not Sent

**Symptom**: No Slack message after deployment

**Causes**:
- `SLACK_WEBHOOK_URL` missing
- Webhook URL expired
- Slack workspace removed

**Solutions**:
```bash
# Check webhook in Slack
# Go to Slack workspace → Apps → Custom Integrations → Incoming Webhooks

# Update webhook URL
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/..."

# Test webhook locally
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-type: application/json' \
  -d '{"text":"Test message"}'
```

---

## Docker Workflow Issues

### ❌ Docker Build Fails

**Symptom**: "docker build failed" error

**Causes**:
- Dockerfile syntax error
- Missing dependencies
- Base image not found
- Build context too large

**Solutions**:
```bash
# Build Docker image locally
docker build -t app:test .

# Check Dockerfile syntax
docker build --progress=plain -t app:test .

# View build output
docker build --no-cache -t app:test .
```

**Common fixes**:
- Check Dockerfile line by line
- Verify base image exists
- Check .dockerignore file
- Remove large files from build context

---

### ❌ Docker Push Fails

**Symptom**: "docker push failed" error

**Causes**:
- Registry authentication failed
- Image name incorrect
- No permission to push

**Solutions**:
```bash
# Login to registry
docker login ghcr.io -u owner -p $GITHUB_TOKEN

# Tag image correctly
docker tag app:latest ghcr.io/owner/repo:latest

# Push with verbose output
docker push ghcr.io/owner/repo:latest --verbose

# Check permissions
gh repo view --json repositoryTopics
```

---

### ❌ Trivy Scan Finds Vulnerabilities

**Symptom**: Trivy detects critical vulnerabilities in Docker image

**Causes**:
- Outdated base image
- Vulnerable dependencies
- Unpatched packages

**Solutions**:
```bash
# Update base image in Dockerfile
# FROM node:18-alpine → FROM node:20-alpine

# Update dependencies
npm update
npm audit fix

# Rebuild and scan
docker build -t app:test .
trivy image app:test
```

**Severity levels**:
- CRITICAL: Fix immediately
- HIGH: Fix before production
- MEDIUM: Fix in next release
- LOW: Fix when convenient

---

### ❌ Image Size Too Large

**Symptom**: Docker image exceeds 500MB

**Causes**:
- Node modules not excluded
- Build artifacts included
- Large dependencies

**Solutions**:
```bash
# Check image size
docker images | grep app

# Analyze layers
docker history app:latest

# Optimize Dockerfile
# Use multi-stage builds
# Exclude unnecessary files
# Use alpine base image
```

**Optimize**:
```dockerfile
# Use alpine for smaller image
FROM node:20-alpine

# Multi-stage build
FROM node:20-alpine AS builder
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
```

---

## Quality Workflow Issues

### ❌ SonarQube Analysis Fails

**Symptom**: "SonarCloud analysis failed" error

**Causes**:
- `SONAR_TOKEN` missing
- Project key not found
- Code coverage missing
- Quality gate failed

**Solutions**:
```bash
# Check SonarCloud project
# Go to sonarcloud.io → Projects

# Generate new token
# SonarCloud Settings → Security → Generate token

# Update token
gh secret set SONAR_TOKEN --body "squ_xxx"

# Run analysis locally
npm run sonar
```

---

### ❌ TypeScript Compilation Fails

**Symptom**: "tsc --noEmit" step fails

**Causes**:
- Type errors in code
- Missing type definitions
- tsconfig.json issues

**Solutions**:
```bash
# Check TypeScript errors
npx tsc --noEmit

# View specific file errors
npx tsc src/app.module.ts

# Install missing types
npm install --save-dev @types/node

# Update tsconfig.json
# Check strict mode settings
# Verify lib and target
```

---

### ❌ Dependency Audit Fails

**Symptom**: "npm audit" detects vulnerabilities

**Causes**:
- Outdated packages
- Known vulnerabilities
- Transitive dependencies

**Solutions**:
```bash
# Check vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Fix specific package
npm install package-name@latest

# Ignore vulnerability (temporary)
npm audit --audit-level=moderate
```

---

### ❌ PR Comment Not Posted

**Symptom**: Quality results not in PR comments

**Causes**:
- `GITHUB_TOKEN` insufficient permissions
- PR not from fork
- Comment format error

**Solutions**:
1. Check Actions permissions in repo settings
2. Verify token has `pull-requests: write` permission
3. Check comment format in workflow

---

## Release Workflow Issues

### ❌ Release Tag Not Triggering

**Symptom**: Release workflow doesn't run when pushing tag

**Causes**:
- Tag doesn't match `v*` pattern
- Tag created locally not pushed
- Workflow file syntax error

**Solutions**:
```bash
# Create tag correctly
git tag v1.0.0
git push origin v1.0.0

# Verify tag created
git tag -l

# Check workflow trigger in file
# on: push: tags: ['v*']
```

---

### ❌ Release Notes Not Generated

**Symptom**: GitHub Release created but notes are empty

**Causes**:
- No commits since last release
- Changelog generation failed
- Template syntax error

**Solutions**:
```bash
# Generate changelog locally
npm run changelog

# Check commit history
git log --oneline v0.9.0..v1.0.0

# Update release notes manually
# Go to GitHub → Releases → Edit v1.0.0
```

---

### ❌ Docker Image Not Tagged with Version

**Symptom**: Docker image missing version tag like `v1.0.0`

**Causes**:
- Tag name incorrect
- Registry tag step failed
- Image name mismatch

**Solutions**:
```bash
# Tag image manually
docker tag ghcr.io/owner/repo:latest ghcr.io/owner/repo:v1.0.0

# Push version tag
docker push ghcr.io/owner/repo:v1.0.0

# List tags
docker images | grep owner/repo
```

---

## General Issues

### ❌ Workflow Runs Slowly

**Symptom**: CI workflow takes 15+ minutes

**Causes**:
- No caching
- Large dependencies
- Slow tests
- Multiple matrix builds

**Optimize**:
```bash
# Enable dependency caching
# Add to workflow:
# - uses: actions/cache@v3
#   with:
#     path: ~/.npm
#     key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}

# Speed up tests
npm run test -- --maxWorkers=4

# Parallel jobs
# Use needs: [test] to parallelize
```

---

### ❌ Workflow Never Completes

**Symptom**: Workflow hangs indefinitely

**Causes**:
- Infinite loop in script
- Deadlock in test
- Hanging process
- Network connection hanging

**Solutions**:
1. Cancel workflow in Actions tab
2. Add timeouts to jobs
3. Check for background processes
4. Review logs for hanging step

---

### ❌ Secrets Not Available in Workflow

**Symptom**: "${{ secrets.SECRET_NAME }}" returns empty

**Causes**:
- Secret not created
- Wrong secret name
- Insufficient permissions
- Secret scoped to wrong environment

**Solutions**:
```bash
# List all secrets
gh secret list

# Create secret
gh secret set SECRET_NAME --body "value"

# Update secret
gh secret set SECRET_NAME --body "new-value"

# Use correct secret name in workflow
# ${{ secrets.DATABASE_URL }}  # Correct
# ${{ secrets.database_url }}  # Wrong (case-sensitive)
```

---

### ❌ Rate Limiting in Workflow

**Symptom**: "API rate limit exceeded" error

**Causes**:
- Too many API calls
- Shared GitHub token quota exceeded
- No token provided to API calls

**Solutions**:
```bash
# Use authentication for API calls
curl -H "Authorization: token ${{ secrets.GITHUB_TOKEN }}" https://api.github.com/...

# Add delays between calls
sleep 5

# Batch API requests
# Use GitHub GraphQL API for efficiency
```

---

### ❌ Permission Denied Errors

**Symptom**: "permission denied" or "access forbidden"

**Causes**:
- `GITHUB_TOKEN` insufficient permissions
- SSH key not configured
- File permissions wrong

**Solutions**:
```bash
# Check token permissions
gh auth status

# Refresh token
gh auth refresh

# Fix file permissions
chmod +x script.sh
chmod 600 private-key

# Check branch protection rules
gh repo view --json branchProtectionRules
```

---

## 📊 Debug Checklist

When workflow fails:

- [ ] Check workflow logs in Actions tab
- [ ] Read error message carefully
- [ ] Search error in this guide
- [ ] Check secrets are configured
- [ ] Verify branch/tag name matches trigger
- [ ] Test locally first
- [ ] Check recent code changes
- [ ] Review git history for breaking changes
- [ ] Check dependencies for updates
- [ ] Verify environment configuration

---

## 🆘 Getting Help

If issue not resolved:

1. **Check logs**: Actions → Workflow → Run → Step output
2. **Review documentation**: `.github/WORKFLOWS.md` and `.github/SECRETS.md`
3. **Search GitHub Issues**: In your repository
4. **GitHub Community**: https://github.community
5. **Action Documentation**: Check action repository on GitHub

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: Ready for Reference
