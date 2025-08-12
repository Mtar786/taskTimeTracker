import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { InvoiceModel, Invoice, InvoiceInput, InvoiceFilter } from '../models/invoice.model';

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clientId, issueDate, dueDate, taxRate, notes, items } = req.body;
    
    // Only admins can create invoices
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can create invoices' });
    }

    const invoiceData: InvoiceInput = {
      clientId,
      issueDate,
      dueDate,
      taxRate,
      notes,
      items: items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        timeEntryIds: item.timeEntryIds || []
      }))
    };

    const invoice = await InvoiceModel.create(invoiceData);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Server error while creating invoice' });
  }
};

export const getInvoice = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }

    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Only admins or the client who owns the invoice can view it
    if (req.user.role !== 'admin' && req.user.id !== invoice.client_id) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error while fetching invoice' });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { clientId, status, startDate, endDate, page = '1', limit = '20' } = req.query;
    
    // Non-admin users can only see their own invoices
    const filter: InvoiceFilter = {
      clientId: req.user.role === 'admin' ? (clientId ? parseInt(clientId as string, 10) : undefined) : req.user.id,
      status: status as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      page: parseInt(page as string, 10) || 1,
      limit: parseInt(limit as string, 10) || 20
    };

    const { invoices, total } = await InvoiceModel.findAll(filter);
    
    res.json({
      data: invoices,
      pagination: {
        total,
        page: filter.page,
        limit: filter.limit,
        totalPages: Math.ceil(total / (filter.limit || 20))
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error while fetching invoices' });
  }
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const invoiceId = parseInt(req.params.id, 10);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }

    const { status, notes } = req.body;
    
    // Only admins can update invoice status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can update invoice status' });
    }

    const updatedInvoice = await InvoiceModel.updateStatus(invoiceId, status, notes);
    
    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(updatedInvoice);
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ message: 'Server error while updating invoice status' });
  }
};

export const getUnbilledTimeEntries = async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.clientId, 10);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: 'Invalid client ID' });
    }

    // Only admins can view unbilled time entries
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can view unbilled time entries' });
    }

    const timeEntries = await InvoiceModel.getUnbilledTimeEntries(clientId);
    res.json(timeEntries);
  } catch (error) {
    console.error('Get unbilled time entries error:', error);
    res.status(500).json({ message: 'Server error while fetching unbilled time entries' });
  }
};

export const downloadInvoicePdf = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }

    // Get the invoice to check permissions
    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Only admins or the client who owns the invoice can download it
    if (req.user.role !== 'admin' && req.user.id !== invoice.client_id) {
      return res.status(403).json({ message: 'Not authorized to download this invoice' });
    }

    // Generate the PDF
    const pdfBuffer = await InvoiceModel.getInvoicePdf(invoiceId);
    
    // Set the appropriate headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
    
    // Send the PDF buffer as the response
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download invoice PDF error:', error);
    res.status(500).json({ message: 'Server error while generating invoice PDF' });
  }
};

export const sendInvoiceEmail = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }

    const { recipientEmail } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ message: 'Recipient email is required' });
    }

    // Only admins can send invoice emails
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can send invoice emails' });
    }

    // Get the invoice to check if it exists
    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Send the invoice email
    const success = await InvoiceModel.sendInvoiceEmail(invoiceId, recipientEmail);
    
    if (!success) {
      return res.status(500).json({ message: 'Failed to send invoice email' });
    }

    res.json({ message: 'Invoice email sent successfully' });
  } catch (error) {
    console.error('Send invoice email error:', error);
    res.status(500).json({ message: 'Server error while sending invoice email' });
  }
};
