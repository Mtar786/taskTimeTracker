import { body, param, query } from 'express-validator';

// Common validators
export const validateInvoiceId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invoice ID must be a positive integer')
    .toInt()
];

export const validateClientId = [
  param('clientId')
    .isInt({ min: 1 })
    .withMessage('Client ID must be a positive integer')
    .toInt()
];

// Invoice creation validators
export const validateCreateInvoice = [
  body('clientId')
    .isInt({ min: 1 })
    .withMessage('Client ID must be a positive integer')
    .toInt(),
    
  body('issueDate')
    .isISO8601()
    .withMessage('Issue date must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Issue date cannot be in the future');
      }
      return true;
    }),
    
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.issueDate && new Date(value) < new Date(req.body.issueDate)) {
        throw new Error('Due date must be after issue date');
      }
      return true;
    }),
    
  body('taxRate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be a number between 0 and 100')
    .toFloat(),
    
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
    
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one invoice item is required'),
    
  body('items.*.description')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Item description is required and cannot exceed 500 characters'),
    
  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Item quantity must be a positive number')
    .toFloat(),
    
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number')
    .toFloat(),
    
  body('items.*.timeEntryIds')
    .optional()
    .isArray()
    .withMessage('Time entry IDs must be an array')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('Time entry IDs must be an array of positive integers')
];

// Invoice query validators
export const validateInvoiceQuery = [
  query('clientId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Client ID must be a positive integer')
    .toInt(),
    
  query('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid status value'),
    
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
    
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate as string)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

// Invoice status update validators
export const validateUpdateStatus = [
  body('status')
    .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid status value'),
    
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// Send invoice email validators
export const validateSendEmail = [
  body('recipientEmail')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];
