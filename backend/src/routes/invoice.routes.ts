import express from 'express';
import { auth } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import * as invoiceController from '../controllers/invoice.controller';
import {
  validateInvoiceId,
  validateClientId,
  validateCreateInvoice,
  validateInvoiceQuery,
  validateUpdateStatus,
  validateSendEmail,
} from '../middleware/invoice-validation.middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Create a new invoice (admin only)
// POST /api/invoices
router.post(
  '/',
  [authorize('admin'), ...validateCreateInvoice],
  invoiceController.createInvoice
);

// Get a specific invoice
// GET /api/invoices/:id
router.get('/:id', validateInvoiceId, invoiceController.getInvoice);

// Get all invoices (filtered)
// GET /api/invoices
router.get('/', validateInvoiceQuery, invoiceController.getInvoices);

// Update invoice status (admin only)
// PATCH /api/invoices/:id/status
router.patch(
  '/:id/status',
  [authorize('admin'), ...validateInvoiceId, ...validateUpdateStatus],
  invoiceController.updateInvoiceStatus
);

// Get unbilled time entries for a client (admin only)
// GET /api/invoices/unbilled-entries/:clientId
router.get(
  '/unbilled-entries/:clientId',
  [authorize('admin'), ...validateClientId],
  invoiceController.getUnbilledTimeEntries
);

// Download invoice as PDF
// GET /api/invoices/:id/download
router.get(
  '/:id/download',
  validateInvoiceId,
  invoiceController.downloadInvoicePdf
);

// Send invoice via email (admin only)
// POST /api/invoices/:id/send
router.post(
  '/:id/send',
  [authorize('admin'), ...validateInvoiceId, ...validateSendEmail],
  invoiceController.sendInvoiceEmail
);

export default router;
