#!/bin/bash

# Premium Check Generator Installation Script

echo "🚀 Starting Premium Check Generator Installation..."
echo "================================================="

# Check for prerequisites
command -v node >/dev/null 2>&1 || { 
  echo "Node.js is not installed. Please install Node.js 16+"; 
  exit 1; 
}

command -v npm >/dev/null 2>&1 || { 
  echo "npm is not installed. Please install npm"; 
  exit 1; 
}

command -v docker >/dev/null 2>&1 || { 
  echo "Docker is not installed. Installing Docker...";
  # Docker installation commands for different OS
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    brew install docker
  fi
}

# Create project structure
echo "📁 Creating project structure..."
mkdir -p check-generator/{frontend,backend,shared,data}
cd check-generator

# Frontend setup
echo "⚛️  Setting up frontend..."
npx create-react-app frontend --template typescript
cd frontend

# Install frontend dependencies
npm install react-dnd react-dnd-html5-backend html2canvas jspdf fabric
npm install axios styled-components react-router-dom react-icons
npm install zod react-hook-form @hookform/resolvers
npm install @stripe/react-stripe-js @stripe/stripe-js
npm install react-toastify chart.js react-chartjs-2

# Backend setup
echo "⚙️  Setting up backend..."
cd ../backend
npm init -y
npm install express cors helmet morgan rate-limiter
npm install mongoose redis jsonwebtoken bcryptjs
npm install pdfkit pdf-lib stripe
npm install aws-sdk multer multer-s3
npm install dotenv winston

# Install development dependencies
npm install -D nodemon jest supertest eslint prettier

# Create necessary directories
mkdir -p {controllers,models,routes,services,middleware,utils,templates,logs}

# Copy configuration files
echo "📋 Copying configuration files..."
cp ../.env.example .env

# Initialize git
echo "📦 Initializing git repository..."
cd ..
git init
echo "node_modules/" > .gitignore
echo "*.env" >> .gitignore
echo "*.log" >> .gitignore
echo ".DS_Store" >> .gitignore

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build

# Display installation complete message
echo ""
echo "✅ Installation Complete!"
echo ""
echo "To start the application:"
echo "1. Configure environment variables:"
echo "   cp .env.example .env"
echo "   # Edit .env with your settings"
echo ""
echo "2. Start the application:"
echo "   docker-compose up"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo ""
echo "For development:"
echo "   cd frontend && npm start"
echo "   cd backend && npm run dev"
echo ""
echo "📚 Documentation available at: /docs"
