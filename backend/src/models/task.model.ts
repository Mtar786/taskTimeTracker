import { Pool } from 'pg';
import pool from '../config/database';

export interface Task {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  due_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TaskInput {
  projectId: number;
  name: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dueDate?: Date | string | null;
}

export class TaskModel {
  static async create(taskData: TaskInput): Promise<Task> {
    const { projectId, name, description, status = 'pending', dueDate = null } = taskData;
    
    const query = `
      INSERT INTO tasks (project_id, name, description, status, due_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [projectId, name, description, status, dueDate];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id: number): Promise<Task | null> {
    const query = 'SELECT * FROM tasks WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByProject(projectId: number): Promise<Task[]> {
    const query = 'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [projectId]);
    return result.rows;
  }

  static async update(id: number, updates: Partial<TaskInput>): Promise<Task | null> {
    const { name, description, status, dueDate } = updates;
    
    const query = `
      UPDATE tasks
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        due_date = COALESCE($4, due_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [name, description, status, dueDate, id];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM tasks WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async userHasAccess(taskId: number, userId: number): Promise<boolean> {
    const query = `
      SELECT 1
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1 AND p.client_id = $2
    `;
    const result = await pool.query(query, [taskId, userId]);
    return result.rows.length > 0;
  }
}
