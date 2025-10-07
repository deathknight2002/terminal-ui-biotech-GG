import { Router } from 'express';

const router = Router();

// Placeholder routes for biotech data
router.get('/assets', (req, res) => {
  res.json({ message: 'Biotech assets endpoint - coming soon' });
});

router.get('/pipeline', (req, res) => {
  res.json({ message: 'Pipeline data endpoint - coming soon' });
});

router.get('/catalysts', (req, res) => {
  res.json({ message: 'Catalysts endpoint - coming soon' });
});

export { router as biotechDataRouter };