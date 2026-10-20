import express from 'express';
import { getDashboard } from '../controllers/dashboardController.js';

const router = express.Router();

// ATS Dashboard analytics
router.get('/', getDashboard);

export default router;
