import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

async function startServer() {
  try {
    console.log('🚀 Starting Biotech Terminal Backend (minimal mode)');

    // Create Express app
    const app = express();
    const server = createServer(app);

    // Enable CORS for frontend
    app.use(cors({
      origin: 'http://localhost:5173',
      credentials: true
    }));

    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Mock biotech data endpoints
    app.get('/api/biotech/metrics', (req, res) => {
      res.json({
        activeDrugs: 2847,
        phaseIII: 342,
        fdaApprovals: 89,
        marketCap: '$2.4T'
      });
    });

    app.get('/api/biotech/pipeline', (req, res) => {
      res.json([
        { phase: 'Preclinical', value: 45, color: '#FF9500' },
        { phase: 'Phase I', value: 28, color: '#00D4FF' },
        { phase: 'Phase II', value: 18, color: '#00FF00' },
        { phase: 'Phase III', value: 9, color: '#A855F7' },
      ]);
    });

    app.get('/api/biotech/companies', (req, res) => {
      res.json([
        { name: 'Moderna', ticker: 'MRNA', phase: 'Commercial', pipeline: 45 },
        { name: 'BioNTech', ticker: 'BNTX', phase: 'Phase III', pipeline: 23 },
        { name: 'Gilead', ticker: 'GILD', phase: 'Phase II', pipeline: 67 },
      ]);
    });

    const PORT = 3001;
    server.listen(PORT, () => {
      console.log(`✅ Biotech Terminal Backend running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🧬 API endpoints: http://localhost:${PORT}/api/biotech/*`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();