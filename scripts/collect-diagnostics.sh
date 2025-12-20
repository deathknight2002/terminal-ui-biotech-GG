#!/bin/bash

# Biotech Terminal - Diagnostic Information Collector
# Collects system information for troubleshooting

set -e

OUTPUT_FILE="diagnostics-$(date +%Y%m%d-%H%M%S).txt"

echo "🔍 Collecting diagnostic information..."
echo ""

# Create output file
cat > "$OUTPUT_FILE" << 'EOF'
================================================================================
BIOTECH TERMINAL PLATFORM - DIAGNOSTIC REPORT
================================================================================
EOF

echo "Generated: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# System Information
echo "📊 System Information" | tee -a "$OUTPUT_FILE"
echo "-------------------" >> "$OUTPUT_FILE"
echo "OS: $(uname -s)" >> "$OUTPUT_FILE"
echo "Kernel: $(uname -r)" >> "$OUTPUT_FILE"
echo "Architecture: $(uname -m)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Python Information
echo "🐍 Python Environment" | tee -a "$OUTPUT_FILE"
echo "-------------------" >> "$OUTPUT_FILE"
if command -v python3 &> /dev/null; then
    echo "Python Version: $(python3 --version)" >> "$OUTPUT_FILE"
    echo "Python Path: $(which python3)" >> "$OUTPUT_FILE"
else
    echo "Python: NOT INSTALLED" >> "$OUTPUT_FILE"
fi

if command -v poetry &> /dev/null; then
    echo "Poetry Version: $(poetry --version)" >> "$OUTPUT_FILE"
    echo "Poetry Path: $(which poetry)" >> "$OUTPUT_FILE"
else
    echo "Poetry: NOT INSTALLED" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Node.js Information
echo "📦 Node.js Environment" | tee -a "$OUTPUT_FILE"
echo "--------------------" >> "$OUTPUT_FILE"
if command -v node &> /dev/null; then
    echo "Node Version: $(node --version)" >> "$OUTPUT_FILE"
    echo "Node Path: $(which node)" >> "$OUTPUT_FILE"
else
    echo "Node: NOT INSTALLED" >> "$OUTPUT_FILE"
fi

if command -v npm &> /dev/null; then
    echo "NPM Version: $(npm --version)" >> "$OUTPUT_FILE"
    echo "NPM Path: $(which npm)" >> "$OUTPUT_FILE"
else
    echo "NPM: NOT INSTALLED" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Docker Information
echo "🐳 Docker Environment" | tee -a "$OUTPUT_FILE"
echo "-------------------" >> "$OUTPUT_FILE"
if command -v docker &> /dev/null; then
    echo "Docker Version: $(docker --version)" >> "$OUTPUT_FILE"
    echo "Docker Path: $(which docker)" >> "$OUTPUT_FILE"
    
    # Docker status
    if docker info &> /dev/null; then
        echo "Docker Status: RUNNING" >> "$OUTPUT_FILE"
        docker system df >> "$OUTPUT_FILE" 2>&1
    else
        echo "Docker Status: NOT RUNNING" >> "$OUTPUT_FILE"
    fi
else
    echo "Docker: NOT INSTALLED" >> "$OUTPUT_FILE"
fi

if command -v docker-compose &> /dev/null || command -v "docker compose" &> /dev/null; then
    if command -v docker-compose &> /dev/null; then
        echo "Docker Compose: $(docker-compose --version)" >> "$OUTPUT_FILE"
    else
        echo "Docker Compose: $(docker compose version)" >> "$OUTPUT_FILE"
    fi
else
    echo "Docker Compose: NOT INSTALLED" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Environment Configuration
echo "⚙️ Environment Configuration" | tee -a "$OUTPUT_FILE"
echo "-------------------------" >> "$OUTPUT_FILE"
if [ -f .env ]; then
    echo ".env file: EXISTS" >> "$OUTPUT_FILE"
    echo "Environment variables (sanitized):" >> "$OUTPUT_FILE"
    # Print env vars but sanitize sensitive data
    grep -v "^#" .env 2>/dev/null | grep -v "^$" | sed 's/=.*/=***REDACTED***/g' >> "$OUTPUT_FILE"
else
    echo ".env file: NOT FOUND" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Database Information
echo "🗄️ Database Status" | tee -a "$OUTPUT_FILE"
echo "----------------" >> "$OUTPUT_FILE"
if [ -f biotech_terminal.db ]; then
    echo "SQLite Database: EXISTS" >> "$OUTPUT_FILE"
    echo "Database Size: $(du -h biotech_terminal.db | cut -f1)" >> "$OUTPUT_FILE"
else
    echo "SQLite Database: NOT FOUND" >> "$OUTPUT_FILE"
fi

if command -v psql &> /dev/null; then
    echo "PostgreSQL Client: INSTALLED" >> "$OUTPUT_FILE"
else
    echo "PostgreSQL Client: NOT INSTALLED" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Docker Container Status
echo "📦 Docker Container Status" | tee -a "$OUTPUT_FILE"
echo "-----------------------" >> "$OUTPUT_FILE"
if command -v docker &> /dev/null && docker info &> /dev/null; then
    docker ps -a --filter "name=biotech" >> "$OUTPUT_FILE" 2>&1
else
    echo "Docker not available" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Recent Logs
echo "📋 Recent Application Logs" | tee -a "$OUTPUT_FILE"
echo "-----------------------" >> "$OUTPUT_FILE"
if [ -f logs/biotech-terminal.log ]; then
    echo "Last 50 lines of application log:" >> "$OUTPUT_FILE"
    tail -n 50 logs/biotech-terminal.log >> "$OUTPUT_FILE" 2>&1
elif command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "Last 50 lines of Docker logs:" >> "$OUTPUT_FILE"
    docker compose logs --tail=50 biotech-terminal >> "$OUTPUT_FILE" 2>&1 || echo "No Docker logs available" >> "$OUTPUT_FILE"
else
    echo "No logs found" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Network Connectivity
echo "🌐 Network Connectivity" | tee -a "$OUTPUT_FILE"
echo "--------------------" >> "$OUTPUT_FILE"
echo "Testing external connectivity..." >> "$OUTPUT_FILE"

# Test key endpoints
declare -a endpoints=(
    "https://finance.yahoo.com"
    "https://clinicaltrials.gov"
    "https://www.fda.gov"
)

for endpoint in "${endpoints[@]}"; do
    if curl -s --connect-timeout 5 -I "$endpoint" > /dev/null 2>&1; then
        echo "✓ $endpoint: REACHABLE" >> "$OUTPUT_FILE"
    else
        echo "✗ $endpoint: UNREACHABLE" >> "$OUTPUT_FILE"
    fi
done
echo "" >> "$OUTPUT_FILE"

# Proxy Configuration
echo "🔌 Proxy Configuration" | tee -a "$OUTPUT_FILE"
echo "-------------------" >> "$OUTPUT_FILE"
if [ ! -z "$HTTP_PROXY" ]; then
    echo "HTTP_PROXY: $HTTP_PROXY" >> "$OUTPUT_FILE"
else
    echo "HTTP_PROXY: Not set" >> "$OUTPUT_FILE"
fi

if [ ! -z "$HTTPS_PROXY" ]; then
    echo "HTTPS_PROXY: $HTTPS_PROXY" >> "$OUTPUT_FILE"
else
    echo "HTTPS_PROXY: Not set" >> "$OUTPUT_FILE"
fi

if [ ! -z "$NO_PROXY" ]; then
    echo "NO_PROXY: $NO_PROXY" >> "$OUTPUT_FILE"
else
    echo "NO_PROXY: Not set" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Disk Space
echo "💾 Disk Space" | tee -a "$OUTPUT_FILE"
echo "-----------" >> "$OUTPUT_FILE"
df -h . >> "$OUTPUT_FILE" 2>&1
echo "" >> "$OUTPUT_FILE"

# Memory Usage
echo "🧠 Memory Usage" | tee -a "$OUTPUT_FILE"
echo "-------------" >> "$OUTPUT_FILE"
if command -v free &> /dev/null; then
    free -h >> "$OUTPUT_FILE" 2>&1
elif [[ "$OSTYPE" == "darwin"* ]]; then
    vm_stat | perl -ne '/page size of (\d+)/ and $size=$1; /Pages\s+([^:]+)[^\d]+(\d+)/ and printf("%-16s % 16.2f Mi\n", "$1:", $2 * $size / 1048576);' >> "$OUTPUT_FILE" 2>&1
else
    echo "Memory information not available" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Port Status
echo "🔌 Port Status" | tee -a "$OUTPUT_FILE"
echo "------------" >> "$OUTPUT_FILE"
if command -v lsof &> /dev/null; then
    echo "Ports in use:" >> "$OUTPUT_FILE"
    for port in 8000 3000 5432 6379; do
        if lsof -i ":$port" > /dev/null 2>&1; then
            echo "Port $port: IN USE" >> "$OUTPUT_FILE"
            lsof -i ":$port" >> "$OUTPUT_FILE" 2>&1
        else
            echo "Port $port: AVAILABLE" >> "$OUTPUT_FILE"
        fi
    done
else
    echo "lsof not available" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# File Structure
echo "📁 File Structure" | tee -a "$OUTPUT_FILE"
echo "--------------" >> "$OUTPUT_FILE"
echo "Key directories:" >> "$OUTPUT_FILE"
for dir in bt_platform frontend-components terminal backend; do
    if [ -d "$dir" ]; then
        echo "✓ $dir: EXISTS" >> "$OUTPUT_FILE"
    else
        echo "✗ $dir: MISSING" >> "$OUTPUT_FILE"
    fi
done
echo "" >> "$OUTPUT_FILE"

# Git Information
echo "🔀 Git Information" | tee -a "$OUTPUT_FILE"
echo "---------------" >> "$OUTPUT_FILE"
if [ -d .git ]; then
    echo "Current Branch: $(git branch --show-current 2>/dev/null)" >> "$OUTPUT_FILE"
    echo "Last Commit: $(git log -1 --oneline 2>/dev/null)" >> "$OUTPUT_FILE"
    echo "Remote URL: $(git config --get remote.origin.url 2>/dev/null)" >> "$OUTPUT_FILE"
else
    echo "Not a git repository" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Dependencies Status
echo "📚 Dependencies Status" | tee -a "$OUTPUT_FILE"
echo "-------------------" >> "$OUTPUT_FILE"
if [ -f package.json ]; then
    echo "Node packages: package.json found" >> "$OUTPUT_FILE"
    if [ -d node_modules ]; then
        echo "node_modules: EXISTS" >> "$OUTPUT_FILE"
    else
        echo "node_modules: NOT INSTALLED" >> "$OUTPUT_FILE"
    fi
fi

if [ -f pyproject.toml ]; then
    echo "Python packages: pyproject.toml found" >> "$OUTPUT_FILE"
    if [ -d .venv ] || [ -f poetry.lock ]; then
        echo "Poetry environment: CONFIGURED" >> "$OUTPUT_FILE"
    else
        echo "Poetry environment: NOT CONFIGURED" >> "$OUTPUT_FILE"
    fi
fi
echo "" >> "$OUTPUT_FILE"

# End of report
echo "=================================================================================" >> "$OUTPUT_FILE"
echo "END OF DIAGNOSTIC REPORT" >> "$OUTPUT_FILE"
echo "=================================================================================" >> "$OUTPUT_FILE"

echo ""
echo "✅ Diagnostic information collected!"
echo ""
echo "Report saved to: $OUTPUT_FILE"
echo ""
echo "Please include this file when requesting support."
echo ""
echo "To view the report:"
echo "  cat $OUTPUT_FILE"
echo ""
echo "To share the report:"
echo "  # GitHub issue: Copy and paste the contents"
echo "  # Email: Attach $OUTPUT_FILE"
echo ""
