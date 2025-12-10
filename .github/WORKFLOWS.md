# 🚀 GitHub Actions CI/CD Documentation

Complete guide for all workflows and CI/CD pipelines.

## Overview

This project uses GitHub Actions for continuous integration and deployment with 5 main workflows:

```
┌─────────────────────────────────────────────────────┐
│            GITHUB ACTIONS CI/CD PIPELINE             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Push/PR                                             │
│    ↓                                                  │
│  ┌──────────────────────────────────────┐           │
│  │    CI Workflow (ci.yml)              │           │
│  │  ├─ Tests (Jest + Gherkin)           │           │
│  │  ├─ Linting (ESLint)                 │           │
│  │  ├─ Build                             │           │
│  │  └─ Security Scan                    │           │
│  └──────────────────────────────────────┘           │
│    ↓                                                  │
│  ✅ CI Passes                                        │
│    ↓                                                  │
│  ┌──────────────────────────────────────┐           │
│  │  Quality Workflow (quality.yml)      │           │
│  │  ├─ SonarQube Analysis               │           │
│  │  ├─ TypeScript Check                 │           │
│  │  └─ Code Metrics                     │           │
│  └──────────────────────────────────────┘           │
│    ↓                                                  │
│  ┌──────────────────────────────────────┐           │
│  │  Docker Workflow (docker.yml)        │           │
│  │  ├─ Build Image                      │           │
│  │  ├─ Security Scan                    │           │
│  │  └─ Push to Registry                 │           │
│  └──────────────────────────────────────┘           │
│    ↓                                                  │
│  ┌──────────────────────────────────────┐           │
│  │  CD Workflow (cd.yml)                │           │
│  │  ├─ Deploy to Staging/Production     │           │
│  │  └─ Verify Deployment                │           │
│  └──────────────────────────────────────┘           │
│    ↓                                                  │
│  Tag Push (v*)                                       │
│    ↓                                                  │
│  ┌──────────────────────────────────────┐           │
│  │  Release Workflow (release.yml)      │           │
│  │  ├─ Run Tests                        │           │
│  │  ├─ Create Release                   │           │
│  │  └─ Publish Docker Image             │           │
│  └──────────────────────────────────────┘           │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 1️⃣ CI Workflow (ci.yml)

### Triggers
- Push to: `main`, `develop`, `staging`
- Pull requests to: `main`, `develop`, `staging`
- Schedule: Daily at 2 AM UTC

### Jobs

#### Test Job
**Matrix Strategy**: Node.js 18.x, 20.x

**Steps**:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run ESLint
5. Check code format
6. Run unit tests with coverage
7. Run Gherkin/BDD tests
8. Upload coverage to Codecov
9. Archive test results

**Services**:
- MongoDB 7.0 (localhost:27017)
- Redis 7-alpine (localhost:6379)

**Environment Variables**:
```
NODE_ENV=test
MONGODB_URI=mongodb://root:password@localhost:27017/taxi-vtc-test
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=test-secret-key-${GITHUB_RUN_ID}
```

#### Security Job
**Steps**:
1. npm audit (moderate severity)
2. Snyk security scan
3. Report vulnerabilities

#### Build Job
**Steps**:
1. Build application (production)
2. Verify build output
3. Upload build artifacts

### Expected Output
- ✅ All tests pass
- ✅ No ESLint errors
- ✅ Coverage report generated
- ✅ Build artifacts uploaded

### Artifacts
- `coverage/` - Test coverage report
- `dist/` - Compiled application

---

## 2️⃣ CD Workflow (cd.yml)

### Triggers
- Push to: `main`, `staging`
- Manual workflow dispatch

### Jobs

#### Deploy Job
**Environment**: 
- Staging (when pushing to staging branch)
- Production (when pushing to main branch)

**Steps**:
1. Checkout code
2. Install dependencies
3. Build application
4. Login to Docker registry
5. Build and push Docker image
6. Deploy to environment
7. Verify deployment

**Docker Tags**:
```
ghcr.io/owner/repo:${SHA}
ghcr.io/owner/repo:latest
```

#### Rollback Job
**Triggers**: When deploy fails

**Steps**:
1. Rollback deployment
2. Notify via Slack

### Notifications
- Slack webhook sent on success/failure
- Deployment URL provided

### Deployment URL Example
```
https://api.prod.example.com  (production)
https://api.staging.example.com  (staging)
```

---

## 3️⃣ Docker Workflow (docker.yml)

### Triggers
- Push to: `main`, `staging`, `develop`
- Tags: `v*`
- Pull requests
- Manual workflow dispatch

### Jobs

#### Build Job
**Registry**: GitHub Container Registry (ghcr.io)

**Tag Strategy**:
```
ghcr.io/owner/repo:branch-name
ghcr.io/owner/repo:v1.0.0
ghcr.io/owner/repo:latest
ghcr.io/owner/repo:sha-abc123
```

**Features**:
- Cache layer optimization
- Multi-platform builds
- Metadata extraction

#### Security Scan Job
**Tool**: Trivy

**Scans for**:
- Critical vulnerabilities
- High severity issues
- Malware

**Output**: SARIF report → GitHub Security tab

#### SBOM Job
**Tool**: Anchore SBOM

**Generates**:
- Software Bill of Materials
- CycloneDX format
- Dependencies list

---

## 4️⃣ Quality Workflow (quality.yml)

### Triggers
- Push to: `main`, `develop`, `staging`
- Pull requests

### Jobs

#### Code Quality Job
**Tools**:
- ESLint - Linting
- SonarQube - Code analysis
- TypeScript - Type checking

**Metrics**:
- File count
- Lines of code
- Code coverage
- Technical debt

#### Dependencies Job
**Checks**:
- Outdated dependencies
- Audit vulnerabilities
- License compliance

#### Comments Job
**PR Comments**:
- Quality check results
- Link to full results
- Status summary

#### Report Job
**Generates**:
- Quality report markdown
- Metrics summary
- Stored as artifact

---

## 5️⃣ Release Workflow (release.yml)

### Triggers
- Git tags: `v*` (e.g., v1.0.0, v1.0.0-rc.1)

### Jobs

#### Release Job
**Steps**:
1. Run full test suite
2. Build application
3. Build Docker image
4. Push to registry
5. Create GitHub Release
6. Generate changelog

**Release Artifacts**:
- Compiled dist/ folder
- CHANGELOG entry
- Docker image tag

**Versioning**:
- Semantic versioning (v1.0.0)
- Pre-release detection (rc, beta)

#### Create Release Notes Job
**Generates**:
- Automated release notes
- Commit history
- Contributors list

#### Notify Deployment Job
**Sends**:
- Release notifications
- Deployment information
- Slack messages

---

## 📊 Workflow Status Badges

Add to README.md:

```markdown
[![CI - Tests & Linting](https://github.com/owner/repo/actions/workflows/ci.yml/badge.svg)](https://github.com/owner/repo/actions/workflows/ci.yml)
[![CD - Deploy](https://github.com/owner/repo/actions/workflows/cd.yml/badge.svg)](https://github.com/owner/repo/actions/workflows/cd.yml)
[![Docker Build & Push](https://github.com/owner/repo/actions/workflows/docker.yml/badge.svg)](https://github.com/owner/repo/actions/workflows/docker.yml)
[![Code Quality](https://github.com/owner/repo/actions/workflows/quality.yml/badge.svg)](https://github.com/owner/repo/actions/workflows/quality.yml)
[![Release](https://github.com/owner/repo/actions/workflows/release.yml/badge.svg)](https://github.com/owner/repo/actions/workflows/release.yml)
```

---

## 🔧 Branch Protection Rules

Recommended configuration for `main` branch:

1. **Require pull request reviews before merging**
   - Dismiss stale reviews: ✓
   - Require code owner reviews: ✓

2. **Require status checks to pass before merging**
   - Required status checks:
     - test (18.x)
     - test (20.x)
     - build
     - security
     - code-quality

3. **Require branches to be up to date before merging**: ✓

4. **Include administrators**: ✓

---

## 🚀 Deployment Process

### Staging Deployment
1. Push to `staging` branch
2. CI workflow runs (tests, linting, security)
3. If passed, CD workflow deploys to staging
4. Verify functionality in staging environment

### Production Deployment
1. Create release tag: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. Release workflow runs
4. Tests must pass
5. Release created on GitHub
6. Docker image published
7. CD workflow deploys to production

### Manual Deployment
1. Go to Actions → CD workflow
2. Click "Run workflow"
3. Select environment (staging/production)
4. Workflow executes

---

## 📈 Monitoring & Alerts

### View Workflow Status
1. Go to Actions tab
2. Select workflow
3. View recent runs

### Workflow Notifications
- Email notifications on failure
- Slack notifications (when configured)
- GitHub notifications for PRs

### Performance Monitoring
- Track workflow duration
- Monitor resource usage
- Check cache hit rates

---

## 🔒 Security Considerations

### Secrets Management
- All sensitive data in GitHub Secrets
- No secrets in code/config
- Rotate regularly
- See `.github/SECRETS.md`

### OIDC Token Authentication
For AWS/Azure/GCP:
```yaml
permissions:
  id-token: write
  contents: read
```

### Branch Protection
- Require status checks
- Require reviews
- Dismiss stale reviews
- Require code owners

### Vulnerability Scanning
- Snyk: npm packages
- Trivy: Docker images
- GitHub Dependabot: Dependencies

---

## 🐛 Troubleshooting

### CI Fails on PR
**Check**:
- Test logs in Actions tab
- Local test run: `npm run test`
- Lint errors: `npm run lint`
- Build errors: `npm run build`

### Deploy Fails
**Check**:
- Deployment credentials in Secrets
- Target environment availability
- Build artifact uploads
- Docker image build logs

### Docker Build Slow
**Optimize**:
- Enable caching: `type=gha`
- Reduce layer count
- Parallel build strategies

### Coverage Not Updating
**Fix**:
- Ensure `npm run test:cov` runs
- Coverage file exists: `coverage/coverage-final.json`
- Codecov token configured
- Check coverage artifacts

---

## 📋 Workflow Checklist

### Setup
- [ ] Create `.github/workflows/` directory
- [ ] Copy workflow YAML files
- [ ] Configure branch protection rules
- [ ] Add required secrets

### Configuration
- [ ] Update `REGISTRY` variable
- [ ] Configure Docker registry credentials
- [ ] Set deployment URLs
- [ ] Add Slack webhook URL

### Testing
- [ ] Run CI workflow on PR
- [ ] Deploy to staging
- [ ] Test deployment in staging
- [ ] Deploy to production

### Monitoring
- [ ] Setup Slack notifications
- [ ] Monitor workflow duration
- [ ] Review coverage trends
- [ ] Check security scans

---

## 📚 References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/guides)
- [Security Hardening](https://docs.github.com/en/actions/security-guides)

---

## 📞 Support

For issues or questions:
1. Check GitHub Actions logs
2. Review this documentation
3. Check `.github/SECRETS.md` for configuration
4. Review branch protection rules
5. Check workflow YAML files for syntax

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: Ready for Production
