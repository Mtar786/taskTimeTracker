import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

// Import routes
import authRoutes from './routes/auth.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create a write stream for logging (in append mode)
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware (HTTP request logger)
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev')); // Log to console in development

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', require('./routes/task.routes').default);
app.use('/api/time-entries', require('./routes/time-entry.routes').default);
app.use('/api/timesheets', require('./routes/timesheet.routes').default);
app.use('/api/invoices', require('./routes/invoice.routes').default);

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.stack);
  
  // Default error status and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log the error
  const errorLog = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}\n` +
                  `Status: ${statusCode}\n` +
                  `Message: ${message}\n` +
                  `Stack: ${err.stack}\n` +
                  '----------------------------------------\n';
  
  fs.appendFile(path.join(logsDir, 'error.log'), errorLog, (err) => {
    if (err) console.error('Error writing to error log:', err);
  });
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`📝 Logs are being written to: ${path.join(logsDir, 'access.log')}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api\n`);
});

export default server;
