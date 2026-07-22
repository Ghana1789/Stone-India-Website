import express from 'express';
import Inquiry from '../models/Inquiry.js';
import Application from '../models/Application.js';
import multer from 'multer';
import path from 'path';

import crypto from 'crypto';

// Multer setup for resumes with security controls
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/'); // Ensure this exists
  },
  filename: (req, file, cb) => {
    // Generate secure randomized name to prevent directory traversal
    const fileExt = path.extname(file.originalname).toLowerCase();
    const secureName = `${crypto.randomBytes(16).toString('hex')}${fileExt}`;
    cb(null, secureName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Security violation: Only .pdf, .doc, and .docx formats are permitted.'));
    }
    
    cb(null, true);
  }
});

const router = express.Router();

// @route   POST /api/public/contact
// @desc    Submit a contact enquiry
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, company, subject, message, type } = req.body;
    
    const inquiry = await Inquiry.create({
      name, email, phone, company, subject, message, type,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, message: 'Message sent successfully!', data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/public/apply
// @desc    Submit a job application
router.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const { jobId, jobTitle, name, email, phone, experience, currentCompany, noticePeriod } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Resume is required' });
    }

    const application = await Application.create({
      jobId, jobTitle, name, email, phone, experience, currentCompany, noticePeriod,
      resume: req.file.path,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, message: 'Application submitted successfully!', data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
