import { body, validationResult } from 'express-validator';

// Disposable email domain list to protect against abuse
const DISPOSABLE_DOMAINS = [
  'mailinator.com', '10minutemail.com', 'yopmail.com', 'tempmail.com',
  'guerrillamail.com', 'sharklasers.com', 'dispostable.com', 'getairmail.com'
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return the first error as a clean user-friendly string
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }
  next();
};

export const registerValidator = [
  body('email')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail()
    .custom((value) => {
      const domain = value.split('@')[1];
      if (DISPOSABLE_DOMAINS.includes(domain)) {
        throw new Error('Disposable email addresses are not allowed.');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[\W_]/).withMessage('Password must contain at least one special character.'),
  body('name').trim().notEmpty().withMessage('Name is required.').escape(),
  body('phone').optional({ checkFalsy: true }).trim().isMobilePhone().withMessage('Please provide a valid phone number.'),
  handleValidationErrors
];

export const loginValidator = [
  body('email').isEmail().withMessage('Please provide a valid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidationErrors
];
