import pool from '../config/database';
import { TimeEntry } from './time-entry.model';

export interface Timesheet {
  id: number;
  user_id: number;
  start_date: Date;
  end_date: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  notes: string | null;
  approved_by: number | null;
  approved_at: Date | null;
  created_at: Date;
  updated_at: Date;
  time_entries?: TimeEntry[];
}

export interface TimesheetInput {
  userId: number;
  startDate: Date | string;
  endDate: Date | string;
  notes?: string;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  timeEntryIds?: number[];
}

export interface TimesheetFilter {
  userId?: number;
  status?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  limit?: number;
}

export class TimesheetModel {
  static async create(timesheetData: TimesheetInput): Promise<Timesheet> {
    const { userId, startDate, endDate, notes = null, status = 'draft', timeEntryIds = [] } = timesheetData;
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create the timesheet
      const timesheetQuery = `
        INSERT INTO timesheets (user_id, start_date, end_date, status, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const timesheetValues = [userId, startDate, endDate, status, notes];
      const timesheetResult = await client.query(timesheetQuery, timesheetValues);
      const timesheet = timesheetResult.rows[0];
      
      // Associate time entries with this timesheet
      if (timeEntryIds.length > 0) {
        const updateQuery = `
          UPDATE time_entries
          SET timesheet_id = $1, status = 'submitted'
          WHERE id = ANY($2::int[]) AND user_id = $3
          RETURNING *
        `;
        
        await client.query(updateQuery, [timesheet.id, timeEntryIds, userId]);
      }
      
      await client.query('COMMIT');
      return timesheet;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id: number): Promise<Timesheet | null> {
    const query = `
      SELECT t.*, 
             json_agg(te.*) as time_entries
      FROM timesheets t
      LEFT JOIN time_entries te ON te.timesheet_id = t.id
      WHERE t.id = $1
      GROUP BY t.id
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findAll(filter: TimesheetFilter = {}): Promise<{ timesheets: Timesheet[], total: number }> {
    const {
      userId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = filter;
    
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;
    
    if (userId) {
      whereClause += ` AND t.user_id = $${paramCount++}`;
      values.push(userId);
    }
    
    if (status) {
      whereClause += ` AND t.status = $${paramCount++}`;
      values.push(status);
    }
    
    if (startDate) {
      whereClause += ` AND t.start_date >= $${paramCount++}`;
      values.push(startDate);
    }
    
    if (endDate) {
      whereClause += ` AND t.end_date <= $${paramCount++}`;
      values.push(endDate);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM timesheets t ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const query = `
      SELECT t.*, 
             u.first_name as user_first_name,
             u.last_name as user_last_name,
             u.email as user_email,
             (SELECT COUNT(*) FROM time_entries WHERE timesheet_id = t.id) as entry_count,
             (SELECT SUM(duration_minutes) FROM time_entries WHERE timesheet_id = t.id) as total_minutes
      FROM timesheets t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.updated_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount}
    `;
    
    const result = await pool.query(query, [...values, limit, offset]);
    
    return {
      timesheets: result.rows,
      total
    };
  }

  static async updateStatus(
    id: number, 
    status: 'draft' | 'submitted' | 'approved' | 'rejected',
    approvedById: number,
    notes: string | null = null
  ): Promise<Timesheet | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update the timesheet status
      const updateQuery = `
        UPDATE timesheets
        SET 
          status = $1,
          notes = COALESCE($2, notes),
          approved_by = $3,
          approved_at = CASE WHEN $1 = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;
      
      const updateValues = [status, notes, approvedById, id];
      const updateResult = await client.query(updateQuery, updateValues);
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      
      const timesheet = updateResult.rows[0];
      
      // If approved or rejected, update the status of associated time entries
      if (status === 'approved' || status === 'rejected') {
        const entryStatus = status === 'approved' ? 'approved' : 'rejected';
        const updateEntriesQuery = `
          UPDATE time_entries
          SET status = $1
          WHERE timesheet_id = $2
          RETURNING *
        `;
        
        await client.query(updateEntriesQuery, [entryStatus, id]);
      }
      
      await client.query('COMMIT');
      return timesheet;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async addTimeEntries(timesheetId: number, timeEntryIds: number[]): Promise<boolean> {
    if (timeEntryIds.length === 0) return true;
    
    const query = `
      UPDATE time_entries
      SET timesheet_id = $1, status = 'submitted'
      WHERE id = ANY($2::int[]) AND timesheet_id IS NULL
      RETURNING *
    `;
    
    const result = await pool.query(query, [timesheetId, timeEntryIds]);
    return result.rowCount > 0;
  }

  static async removeTimeEntries(timesheetId: number, timeEntryIds: number[]): Promise<boolean> {
    if (timeEntryIds.length === 0) return true;
    
    const query = `
      UPDATE time_entries
      SET timesheet_id = NULL, status = 'draft'
      WHERE id = ANY($1::int[]) AND timesheet_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [timeEntryIds, timesheetId]);
    return result.rowCount > 0;
  }

  static async getTimeEntriesForApproval(filter: {
    userId?: number;
    projectId?: number;
    clientId?: number;
    startDate?: Date | string;
    endDate?: Date | string;
    status?: string;
  } = {}): Promise<TimeEntry[]> {
    const {
      userId,
      projectId,
      clientId,
      startDate,
      endDate,
      status = 'submitted'
    } = filter;
    
    let whereClause = 'WHERE te.status = $1';
    const values: any[] = [status];
    let paramCount = 2;
    
    if (userId) {
      whereClause += ` AND te.user_id = $${paramCount++}`;
      values.push(userId);
    }
    
    if (projectId) {
      whereClause += ` AND t.project_id = $${paramCount++}`;
      values.push(projectId);
    }
    
    if (clientId) {
      whereClause += ` AND p.client_id = $${paramCount++}`;
      values.push(clientId);
    }
    
    if (startDate) {
      whereClause += ` AND te.start_time >= $${paramCount++}`;
      values.push(startDate);
    }
    
    if (endDate) {
      whereClause += ` AND te.start_time <= $${paramCount++}`;
      values.push(endDate);
    }
    
    const query = `
      SELECT 
        te.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        t.name as task_name,
        p.name as project_name,
        p.hourly_rate
      FROM time_entries te
      JOIN users u ON te.user_id = u.id
      JOIN tasks t ON te.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      ${whereClause}
      ORDER BY te.start_time DESC
    `;
    
    const result = await pool.query(query, values);
    return result.rows;
  }
}
