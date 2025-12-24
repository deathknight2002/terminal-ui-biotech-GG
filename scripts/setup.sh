#!/bin/bash

# Biotech Terminal Platform Setup Script
# One-command setup for the entire platform

set -e

echo "🚀 Setting up Biotech Terminal Platform..."

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."

    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3.9+ is required but not installed."
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 18+ is required but not installed."
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        echo "❌ npm is required but not installed."
        exit 1
    fi

    echo "✅ Prerequisites check passed"
}

# Setup Python environment
setup_python() {
    echo "🐍 Setting up Python environment..."

    # Install Poetry if not available
    if ! command -v poetry &> /dev/null; then
        echo "📦 Installing Poetry..."
        curl -sSL https://install.python-poetry.org | python3 -
        export PATH="$HOME/.local/bin:$PATH"
    fi

    # Install Python dependencies
    echo "📦 Installing Python dependencies..."
    poetry install

    # Initialize database
    echo "🗄️ Initializing database..."
    poetry run python -c "
import asyncio
from bt_platform.core.database import init_db
asyncio.run(init_db())
"

    echo "✅ Python setup complete"
}

# Setup Node.js environment
setup_nodejs() {
    echo "📦 Setting up Node.js environment..."

    # Install root dependencies
    echo "📦 Installing root dependencies..."
    npm install

    # Setup frontend components
    echo "🎨 Setting up frontend components..."
    cd frontend-components
    npm install
    npm run build
    cd ..

    # Setup terminal application
    echo "🖥️ Setting up terminal application..."
    cd terminal
    npm install
    cd ..

    # Setup examples
    echo "📚 Setting up examples..."
    cd examples
    npm install
    cd ..

    echo "✅ Node.js setup complete"
}

# Create environment file
create_env_file() {
    echo "⚙️ Creating environment configuration..."

    if [ ! -f .env ]; then
        cat > .env << EOF
# Biotech Terminal Platform Configuration

# Application
DEBUG=true
API_VERSION=v1

# Server
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=sqlite:///./biotech_terminal.db

# Redis (optional)
REDIS_URL=redis://localhost:6379

# External APIs (optional - platform works without them)
FDA_API_KEY=
CLINICALTRIALS_API_KEY=
PUBMED_API_KEY=

# Security
SECRET_KEY=biotech-terminal-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Logging
LOG_LEVEL=INFO
EOF
        echo "✅ Created .env file"
    else
        echo "✅ .env file already exists"
    fi
}

# Start services
start_services() {
    echo "🚀 Starting services..."

    # Start Node backend (primary API)
    echo "🔧 Starting Node backend (real-time API)..."
    export API_PORT=${API_PORT:-3001}
    export CORS_ORIGIN=${CORS_ORIGIN:-"*"}
    export JWT_SECRET=${JWT_SECRET:-"dev-secret-key-change-me-please-32-chars"}

    cd backend
    npm run dev > ../.dev-node.log 2>&1 &
    NODE_BACKEND_PID=$!
    cd ..

    sleep 5

    # Check if Node backend started successfully
    if curl -s http://localhost:${API_PORT}/health > /dev/null; then
        echo "✅ Node backend running at http://localhost:${API_PORT}"
    else
        echo "❌ Node backend failed to start (see .dev-node.log for details)"
        kill $NODE_BACKEND_PID 2>/dev/null || true
        exit 1
    fi

    # Start Python backend in background
    echo "🐍 Starting Python backend (evidence graph API)..."
    poetry run uvicorn bt_platform.core.app:app --reload --host 0.0.0.0 --port 8000 > .dev-python.log 2>&1 &
    PY_BACKEND_PID=$!

    sleep 3

    # Check if Python backend started successfully
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ Python backend running at http://localhost:8000"
        echo "📖 API documentation at http://localhost:8000/docs"
    else
        echo "❌ Python backend failed to start (see .dev-python.log for details)"
        kill $NODE_BACKEND_PID 2>/dev/null || true
        kill $PY_BACKEND_PID 2>/dev/null || true
        exit 1
    fi

    # Start frontend
    echo "🎨 Starting terminal application..."
    cd terminal
    npm run dev &
    FRONTEND_PID=$!
    cd ..

    sleep 3
    echo "✅ Terminal application will be available at http://localhost:3000"

    # Cleanup function
    cleanup() {
        echo "🔄 Shutting down services..."
        kill $NODE_BACKEND_PID 2>/dev/null || true
        kill $PY_BACKEND_PID 2>/dev/null || true
        kill $FRONTEND_PID 2>/dev/null || true
        exit 0
    }

    # Handle Ctrl+C
    trap cleanup SIGINT SIGTERM

    echo ""
    echo "🎉 Biotech Terminal Platform is running!"
    echo ""
    echo "📊 Node API: http://localhost:${API_PORT}"
    echo "📖 Node health: http://localhost:${API_PORT}/health"
    echo "📊 Python API: http://localhost:8000"
    echo "📖 Python docs: http://localhost:8000/docs"
    echo "🖥️ Terminal App: http://localhost:3000"
    echo ""
    echo "Press Ctrl+C to stop all services"

    # Wait for user to stop
    wait
}

# Run development mode
run_dev() {
    echo "🔧 Running in development mode..."
    start_services
}

# Build for production
build_production() {
    echo "🏗️ Building for production..."

    # Build Python package
    echo "📦 Building Python package..."
    poetry build

    # Build frontend components
    echo "🎨 Building frontend components..."
    npm run build

    # Build terminal application
    echo "🖥️ Building terminal application..."
    cd terminal
    npm run build
    cd ..

    echo "✅ Production build complete"
    echo "📦 Artifacts:"
    echo "  - Python wheel: dist/"
    echo "  - Frontend components: dist/"
    echo "  - Terminal app: terminal/dist/"
}

# Main execution
main() {
    case "${1:-setup}" in
        "setup")
            check_prerequisites
            create_env_file
            setup_python
            setup_nodejs
            echo ""
            echo "🎉 Setup complete!"
            echo ""
            echo "Next steps:"
            echo "  ./scripts/setup.sh dev    # Start development servers"
            echo "  ./scripts/setup.sh build  # Build for production"
            ;;
        "dev")
            run_dev
            ;;
        "build")
            build_production
            ;;
        "python")
            setup_python
            ;;
        "nodejs")
            setup_nodejs
            ;;
        *)
            echo "Usage: $0 [setup|dev|build|python|nodejs]"
            echo ""
            echo "Commands:"
            echo "  setup   - Full platform setup (default)"
            echo "  dev     - Start development servers"
            echo "  build   - Build for production"
            echo "  python  - Setup Python environment only"
            echo "  nodejs  - Setup Node.js environment only"
            exit 1
            ;;
    esac
}

main "$@"