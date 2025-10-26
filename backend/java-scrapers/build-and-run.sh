#!/bin/bash
# Build and run KOL scrapers

set -e

cd "$(dirname "$0")"

echo "🔨 Building KOL scrapers..."
mvn clean package -q

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📊 Running scrapers..."
    OUTPUT_FILE="${1:-kol_signals_output.json}"
    java -jar target/kol-scrapers-1.0.0.jar "$OUTPUT_FILE"

    if [ -f "$OUTPUT_FILE" ]; then
        echo ""
        echo "✅ Results saved to: $OUTPUT_FILE"
        echo "📈 Summary:"
        cat "$OUTPUT_FILE" | grep -A 3 "total_signals" | head -4
    fi
else
    echo "❌ Build failed!"
    exit 1
fi
