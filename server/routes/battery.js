import express from 'express';
import Battery from '../models/Battery.js';
import { protect, authorize } from '../middleware/auth.js';
import { mockBatteries } from '../mockData.js';

const router = express.Router();

// ─── PUBLIC ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    if (process.env.USE_MOCK !== 'false') {
      return res.json({ success: true, data: mockBatteries });
    }
    const { category, featured, search } = req.query;
    // ... (rest of original filter code)
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;

    const batteries = await Battery.find(filter).sort({ isFeatured: -1, createdAt: -1 });
    res.json({ success: true, data: batteries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const battery = await Battery.findById(req.params.id);
    if (!battery) return res.status(404).json({ success: false, message: 'Battery not found.' });
    res.json({ success: true, data: battery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN ONLY ─────────────────────────────────────────────────────────────
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const battery = await Battery.create(req.body);
    res.status(201).json({ success: true, data: battery });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const battery = await Battery.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!battery) return res.status(404).json({ success: false, message: 'Battery not found.' });
    res.json({ success: true, data: battery });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const battery = await Battery.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.json({ success: true, message: 'Battery removed from catalogue.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
