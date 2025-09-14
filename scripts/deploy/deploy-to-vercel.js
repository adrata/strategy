const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function deployToVercel() {
  try {
    console.log('🚀 DEPLOYING TO VERCEL');
    console.log('=======================');
    
    // Check if we're in a git repository
    try {
      execSync('git status', { stdio: 'pipe' });
      console.log('✅ Git repository detected');
    } catch (error) {
      console.log('❌ Not in a git repository. Initializing...');
      execSync('git init', { stdio: 'inherit' });
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "Initial commit for Vercel deployment"', { stdio: 'inherit' });
    }
    
    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      console.log('✅ Vercel CLI detected');
    } catch (error) {
      console.log('📦 Installing Vercel CLI...');
      execSync('npm install -g vercel', { stdio: 'inherit' });
    }
    
    // Create/update vercel.json if it doesn't exist
    const vercelConfig = {
      "functions": {
        "src/app/api/**/*.ts": {
          "maxDuration": 300
        }
      },
      "crons": [
        {
          "path": "/api/email/sync-scheduler",
          "schedule": "*/15 * * * *"
        },
        {
          "path": "/api/calendar/scheduler", 
          "schedule": "*/15 * * * *"
        }
      ],
      "env": {
        "NODE_ENV": "production"
      }
    };
    
    if (!fs.existsSync('vercel.json')) {
      fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
      console.log('✅ Created vercel.json configuration');
    } else {
      console.log('✅ vercel.json already exists');
    }
    
    // Check if .env.local exists and create .env.example
    if (fs.existsSync('.env.local')) {
      console.log('✅ Environment variables found');
      
      // Create .env.example for reference
      const envExample = `# Database
DATABASE_URL="postgresql://..."

# OAuth Providers
MICROSOFT_CLIENT_ID="..."
MICROSOFT_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# API Keys
RESEND_API_KEY="..."
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."

# Pusher
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."

# JWT
JWT_SECRET="..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://your-domain.vercel.app"
`;
      
      if (!fs.existsSync('.env.example')) {
        fs.writeFileSync('.env.example', envExample);
        console.log('✅ Created .env.example for reference');
      }
    } else {
      console.log('⚠️  No .env.local found. You\'ll need to set environment variables in Vercel dashboard.');
    }
    
    // Build the project
    console.log('🔨 Building project...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed');
    
    // Deploy to Vercel
    console.log('🚀 Deploying to Vercel...');
    console.log('This will open the Vercel deployment wizard...');
    
    execSync('vercel --prod', { stdio: 'inherit' });
    
    console.log('✅ Deployment completed!');
    console.log('\n📋 NEXT STEPS:');
    console.log('==============');
    console.log('1. Set environment variables in Vercel dashboard');
    console.log('2. Run database migrations: npx prisma migrate deploy');
    console.log('3. Start background services via API endpoints');
    console.log('4. Monitor deployment in Vercel dashboard');
    
    console.log('\n🔧 BACKGROUND SERVICES:');
    console.log('=======================');
    console.log('Email Sync: POST /api/email/sync-scheduler');
    console.log('Calendar Sync: POST /api/calendar/scheduler');
    console.log('Cloud Processing: POST /api/email/cloud-processor');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\n💡 MANUAL DEPLOYMENT STEPS:');
    console.log('============================');
    console.log('1. Push to GitHub: git push origin main');
    console.log('2. Connect repository to Vercel');
    console.log('3. Set environment variables');
    console.log('4. Deploy and configure cron jobs');
  }
}

deployToVercel();
