import { Pool } from 'pg';
import pool from '../config/database';

export interface TimeEntry {
  id: number;
  user_id: number;
  task_id: number;
  start_time: Date;
  end_time: Date | null;
  duration_minutes: number | null;
  description: string | null;
  is_billable: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'billed';
  created_at: Date;
  updated_at: Date;
}

export interface TimeEntryInput {
  taskId: number;
  startTime: Date | string;
  endTime?: Date | string | null;
  durationMinutes?: number | null;
  description?: string;
  isBillable?: boolean;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'billed';
}

export class TimeEntryModel {
  static async create(timeEntryData: TimeEntryInput, userId: number): Promise<TimeEntry> {
    const { 
      taskId, 
      startTime, 
      endTime = null, 
      durationMinutes = null,
      description = null, 
      isBillable = true,
      status = 'draft'
    } = timeEntryData;
    
    const query = `
      INSERT INTO time_entries 
        (user_id, task_id, start_time, end_time, duration_minutes, description, is_billable, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      userId, 
      taskId, 
      startTime, 
      endTime,
      durationMinutes,
      description,
      isBillable,
      status
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id: number): Promise<TimeEntry | null> {
    const query = 'SELECT * FROM time_entries WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByUser(userId: number, options: { 
    startDate?: Date | string;
    endDate?: Date | string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ entries: TimeEntry[], total: number }> {
    const { startDate, endDate, status, limit = 50, offset = 0 } = options;
    
    let query = 'FROM time_entries WHERE user_id = $1';
    const values: any[] = [userId];
    let paramCount = 2;

    if (startDate) {
      query += ` AND start_time >= $${paramCount++}`;
      values.push(startDate);
    }
    
    if (endDate) {
      query += ` AND start_time <= $${paramCount++}`;
      values.push(endDate);
    }
    
    if (status) {
      query += ` AND status = $${paramCount++}`;
      values.push(status);
    }

    // Get total count
    const countResult = await pool.query(`SELECT COUNT(*) ${query}`, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    values.push(limit, offset);
    const dataQuery = `
      SELECT * ${query}
      ORDER BY start_time DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const dataResult = await pool.query(dataQuery, values);
    
    return {
      entries: dataResult.rows,
      total
    };
  }

  static async findByTask(taskId: number): Promise<TimeEntry[]> {
    const query = 'SELECT * FROM time_entries WHERE task_id = $1 ORDER BY start_time DESC';
    const result = await pool.query(query, [taskId]);
    return result.rows;
  }

  static async update(id: number, updates: Partial<TimeEntryInput>): Promise<TimeEntry | null> {
    const { 
      startTime, 
      endTime, 
      durationMinutes,
      description,
      isBillable,
      status 
    } = updates;
    
    const query = `
      UPDATE time_entries
      SET 
        start_time = COALESCE($1, start_time),
        end_time = COALESCE($2, end_time),
        duration_minutes = COALESCE($3, duration_minutes),
        description = COALESCE($4, description),
        is_billable = COALESCE($5, is_billable),
        status = COALESCE($6, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    
    const values = [
      startTime,
      endTime,
      durationMinutes,
      description,
      isBillable,
      status,
      id
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM time_entries WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async userOwnsEntry(entryId: number, userId: number): Promise<boolean> {
    const query = 'SELECT 1 FROM time_entries WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [entryId, userId]);
    return result.rowCount > 0;
  }

  static async calculateBillableHours(userId: number, options: {
    startDate?: Date | string;
    endDate?: Date | string;
  } = {}): Promise<{ totalHours: number; billableAmount: number }> {
    const { startDate, endDate } = options;
    
    let query = `
      SELECT 
        COALESCE(SUM(duration_minutes), 0) as total_minutes,
        p.hourly_rate
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE te.user_id = $1 
        AND te.is_billable = true 
        AND te.status = 'approved'
    `;
    
    const values: any[] = [userId];
    let paramCount = 2;

    if (startDate) {
      query += ` AND te.start_time >= $${paramCount++}`;
      values.push(startDate);
    }
    
    if (endDate) {
      query += ` AND te.start_time <= $${paramCount++}`;
      values.push(endDate);
    }

    query += ' GROUP BY p.hourly_rate';
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return { totalHours: 0, billableAmount: 0 };
    }
    
    // Sum up all billable minutes and calculate amount
    const totalMinutes = result.rows.reduce((sum, row) => sum + parseInt(row.total_minutes, 10), 0);
    const totalHours = totalMinutes / 60;
    
    // For simplicity, using the first project's hourly rate
    // In a real app, you might want to handle multiple rates differently
    const hourlyRate = parseFloat(result.rows[0].hourly_rate);
    const billableAmount = (totalMinutes / 60) * hourlyRate;
    
    return { 
      totalHours: parseFloat(totalHours.toFixed(2)), 
      billableAmount: parseFloat(billableAmount.toFixed(2)) 
    };
  }
}
