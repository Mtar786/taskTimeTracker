import pool from '../config/database';

export interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  issue_date: Date;
  due_date: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  client?: {
    id: number;
    company_name: string | null;
    first_name: string;
    last_name: string;
    email: string;
  };
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  time_entry_ids: number[];
  created_at: Date;
}

export interface InvoiceInput {
  clientId: number;
  issueDate: Date | string;
  dueDate: Date | string;
  taxRate: number;
  notes?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    timeEntryIds: number[];
  }>;
}

export interface InvoiceFilter {
  clientId?: number;
  status?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  limit?: number;
}

export class InvoiceModel {
  static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get the count of invoices for this month
    const countQuery = `
      SELECT COUNT(*) 
      FROM invoices 
      WHERE EXTRACT(YEAR FROM created_at) = $1 
      AND EXTRACT(MONTH FROM created_at) = $2
    `;
    
    const countResult = await pool.query(countQuery, [year, month]);
    const count = parseInt(countResult.rows[0].count, 10) + 1;
    
    return `INV-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  static async create(invoiceData: InvoiceInput): Promise<Invoice> {
    const { clientId, issueDate, dueDate, taxRate, notes = null, items } = invoiceData;
    
    // Calculate subtotal, tax, and total
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create the invoice
      const invoiceQuery = `
        INSERT INTO invoices (
          invoice_number, 
          client_id, 
          issue_date, 
          due_date, 
          status, 
          subtotal, 
          tax_rate, 
          tax_amount, 
          total, 
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const invoiceValues = [
        invoiceNumber,
        clientId,
        issueDate,
        dueDate,
        'draft',
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes
      ];
      
      const invoiceResult = await client.query(invoiceQuery, invoiceValues);
      const invoice = invoiceResult.rows[0];
      
      // Add invoice items
      for (const item of items) {
        const itemQuery = `
          INSERT INTO invoice_items (
            invoice_id, 
            description, 
            quantity, 
            unit_price, 
            amount,
            time_entry_ids
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const itemAmount = item.quantity * item.unitPrice;
        
        await client.query(itemQuery, [
          invoice.id,
          item.description,
          item.quantity,
          item.unitPrice,
          itemAmount,
          item.timeEntryIds
        ]);
        
        // Update time entries to mark them as billed
        if (item.timeEntryIds && item.timeEntryIds.length > 0) {
          const updateTimeEntriesQuery = `
            UPDATE time_entries
            SET status = 'billed'
            WHERE id = ANY($1)
          `;
          
          await client.query(updateTimeEntriesQuery, [item.timeEntryIds]);
        }
      }
      
      await client.query('COMMIT');
      
      // Get the full invoice with items
      const fullInvoice = await this.findById(invoice.id);
      return fullInvoice!;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id: number): Promise<Invoice | null> {
    const client = await pool.connect();
    
    try {
      // Get the invoice
      const invoiceQuery = `
        SELECT i.*, 
               u.first_name, 
               u.last_name, 
               u.email, 
               u.company_name
        FROM invoices i
        JOIN users u ON i.client_id = u.id
        WHERE i.id = $1
      `;
      
      const invoiceResult = await client.query(invoiceQuery, [id]);
      
      if (invoiceResult.rows.length === 0) {
        return null;
      }
      
      const invoice = invoiceResult.rows[0];
      
      // Get invoice items
      const itemsQuery = `
        SELECT * 
        FROM invoice_items 
        WHERE invoice_id = $1
        ORDER BY id
      `;
      
      const itemsResult = await client.query(itemsQuery, [id]);
      
      return {
        ...invoice,
        client: {
          id: invoice.client_id,
          company_name: invoice.company_name,
          first_name: invoice.first_name,
          last_name: invoice.last_name,
          email: invoice.email
        },
        items: itemsResult.rows
      };
    } finally {
      client.release();
    }
  }

  static async findAll(filter: InvoiceFilter = {}): Promise<{ invoices: Invoice[], total: number }> {
    const {
      clientId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = filter;
    
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;
    
    if (clientId) {
      whereClause += ` AND i.client_id = $${paramCount++}`;
      values.push(clientId);
    }
    
    if (status) {
      whereClause += ` AND i.status = $${paramCount++}`;
      values.push(status);
    }
    
    if (startDate) {
      whereClause += ` AND i.issue_date >= $${paramCount++}`;
      values.push(startDate);
    }
    
    if (endDate) {
      whereClause += ` AND i.issue_date <= $${paramCount++}`;
      values.push(endDate);
    }
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM invoices i
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const query = `
      SELECT 
        i.*,
        u.first_name,
        u.last_name,
        u.email,
        u.company_name,
        (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id) as item_count,
        (SELECT SUM(amount) FROM invoice_items WHERE invoice_id = i.id) as items_total
      FROM invoices i
      JOIN users u ON i.client_id = u.id
      ${whereClause}
      ORDER BY i.issue_date DESC, i.id DESC
      LIMIT $${paramCount++} OFFSET $${paramCount}
    `;
    
    const result = await pool.query(query, [...values, limit, offset]);
    
    // Format the results
    const invoices = result.rows.map(row => ({
      ...row,
      client: {
        id: row.client_id,
        company_name: row.company_name,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email
      }
    }));
    
    return {
      invoices,
      total
    };
  }

  static async updateStatus(
    id: number, 
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
    notes: string | null = null
  ): Promise<Invoice | null> {
    const query = `
      UPDATE invoices
      SET 
        status = $1,
        notes = COALESCE($2, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, notes, id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // If marking as paid, update the paid_at timestamp
    if (status === 'paid') {
      await pool.query(
        'UPDATE invoices SET paid_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
    }
    
    return this.findById(id);
  }

  static async getUnbilledTimeEntries(clientId: number): Promise<any[]> {
    const query = `
      SELECT 
        te.id,
        te.start_time,
        te.end_time,
        te.duration_minutes,
        te.description,
        te.is_billable,
        te.status,
        t.name as task_name,
        p.name as project_name,
        p.hourly_rate,
        u.first_name,
        u.last_name
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      JOIN users u ON te.user_id = u.id
      WHERE p.client_id = $1
        AND te.status = 'approved'
        AND te.is_billable = true
        AND te.id NOT IN (
          SELECT unnest(time_entry_ids)
          FROM invoice_items
          WHERE array_length(time_entry_ids, 1) > 0
        )
      ORDER BY te.start_time DESC
    `;
    
    const result = await pool.query(query, [clientId]);
    return result.rows;
  }

  static async getInvoicePdf(invoiceId: number): Promise<Buffer> {
    // In a real implementation, this would generate a PDF using a library like pdfkit
    // For now, we'll just return a dummy buffer
    return Buffer.from('PDF content would be generated here');
  }

  static async sendInvoiceEmail(invoiceId: number, recipientEmail: string): Promise<boolean> {
    // In a real implementation, this would send an email with the invoice attached
    // For now, we'll just log the action
    console.log(`Sending invoice ${invoiceId} to ${recipientEmail}`);
    return true;
  }
}
