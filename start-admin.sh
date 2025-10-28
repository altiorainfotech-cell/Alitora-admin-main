#!/bin/bash

echo "🚀 Starting Altiora Admin Panel..."
echo "📍 Server will run on: http://localhost:3001"
echo "📋 Staff Management: http://localhost:3001/admin/staff"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🔄 Starting development server..."
npm run dev:3001