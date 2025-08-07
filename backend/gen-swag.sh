#!/bin/bash

# gen-swag.sh - Generate Swagger documentation for Radar Hub Manager API

set -e

echo "🔄 Generating Swagger documentation..."

# Check if swag is installed
if ! command -v swag &> /dev/null; then
    echo "❌ swag command not found. Installing swag..."
    go install github.com/swaggo/swag/cmd/swag@latest
    echo "✅ swag installed successfully"
fi

# Generate swagger docs
echo "📝 Running swag init..."
swag init -g cmd/server/main.go -o docs --parseDependency --parseInternal

if [ $? -eq 0 ]; then
    echo "✅ Swagger documentation generated successfully!"
    echo "📁 Files created:"
    echo "   - docs/docs.go"
    echo "   - docs/swagger.json"
    echo "   - docs/swagger.yaml"
    echo ""
    echo "🌐 Access Swagger UI at: http://localhost:8080/v1/api/radar-hub-manager/swagger/index.html"
    echo "   (when server is running)"
else
    echo "❌ Failed to generate Swagger documentation"
    exit 1
fi
