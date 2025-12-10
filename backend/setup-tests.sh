#!/bin/bash
# setup-tests.sh - Script to setup testing environment

echo "🧪 Setting up testing environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create test database
echo "🗄️  Starting test database..."
docker-compose -f docker-compose.yml up -d mongo redis mongo-express

# Wait for services
echo "⏳ Waiting for services..."
sleep 5

# Run tests
echo "🧪 Running unit tests..."
npm run test

echo "🥒 Running Gherkin tests..."
npm run test:gherkin

echo "📊 Generating coverage report..."
npm run test:cov

echo "✅ Testing setup complete!"
echo ""
echo "📚 Documentation:"
echo "  - Full guide: docs/03-TESTING.md"
echo "  - Quick ref: TESTING_QUICK_REF.md"
echo "  - Summary: TEST_SUMMARY.md"
echo ""
echo "📖 View coverage:"
echo "  - open coverage/index.html"
echo ""
echo "🚀 Next steps:"
echo "  1. Read the testing guide: docs/03-TESTING.md"
echo "  2. Run tests: npm run test"
echo "  3. Run BDD tests: npm run test:gherkin"
echo "  4. Check coverage: npm run test:cov"
