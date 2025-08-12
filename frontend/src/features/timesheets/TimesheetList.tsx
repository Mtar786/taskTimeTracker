import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import * as api from '../../services/api';
import { Timesheet, TimesheetStatus, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

// Mock data for development
const mockTimesheets: Timesheet[] = [
  {
    id: '1',
    userId: '1',
    startDate: '2023-05-01',
    endDate: '2023-05-07',
    status: 'submitted',
    totalHours: 40,
    notes: 'Completed project tasks',
    approvedById: '2',
    approvedAt: '2023-05-08T10:00:00Z',
    createdAt: '2023-05-07T18:30:00Z',
    updatedAt: '2023-05-08T10:00:00Z',
  },
  {
    id: '2',
    userId: '1',
    startDate: '2023-05-08',
    endDate: '2023-05-14',
    status: 'approved',
    totalHours: 37.5,
    notes: 'Client meetings and development',
    approvedById: '2',
    approvedAt: '2023-05-15T09:15:00Z',
    createdAt: '2023-05-14T17:45:00Z',
    updatedAt: '2023-05-15T09:15:00Z',
  },
  {
    id: '3',
    userId: '1',
    startDate: '2023-05-15',
    endDate: '2023-05-21',
    status: 'draft',
    totalHours: 22.5,
    notes: '',
    approvedById: null,
    approvedAt: null,
    createdAt: '2023-05-21T16:20:00Z',
    updatedAt: '2023-05-21T16:20:00Z',
  },
];

const TimesheetList: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),     // Sunday
  });

  // Fetch timesheets
  const { data: timesheets = [], isLoading, isError } = useQuery<Timesheet[]>({
    queryKey: ['timesheets'],
    queryFn: () => new Promise(resolve => {
      setTimeout(() => resolve(mockTimesheets), 500);
    }),
  });

  // Handle status filter change
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  // Navigate to previous/next week
  const navigateWeek = (direction: 'prev' | 'next') => {
    setDateRange(prev => ({
      start: direction === 'prev' 
        ? subWeeks(prev.start, 1) 
        : addWeeks(prev.start, 1),
      end: direction === 'prev'
        ? subWeeks(prev.end, 1)
        : addWeeks(prev.end, 1),
    }));
  };

  // Filter timesheets based on filters
  const filteredTimesheets = timesheets.filter(timesheet => {
    // Status filter
    if (statusFilter !== 'all' && timesheet.status !== statusFilter) {
      return false;
    }
    
    // Search term filter (in notes or date range)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const notesMatch = timesheet.notes?.toLowerCase().includes(searchLower) || false;
      const dateMatch = 
        timesheet.startDate.toLowerCase().includes(searchLower) ||
        timesheet.endDate.toLowerCase().includes(searchLower);
      
      if (!notesMatch && !dateMatch) {
        return false;
      }
    }
    
    return true;
  });

  // Handle timesheet actions
  const handleSubmitTimesheet = (id: string) => {
    // In a real app, this would be an API call
    console.log('Submitting timesheet:', id);
  };

  const handleApproveTimesheet = (id: string) => {
    // In a real app, this would be an API call
    console.log('Approving timesheet:', id);
  };

  const handleRejectTimesheet = (id: string) => {
    // In a real app, this would be an API call
    console.log('Rejecting timesheet:', id);
  };

  const handleDeleteTimesheet = (id: string) => {
    if (window.confirm('Are you sure you want to delete this timesheet?')) {
      // In a real app, this would be an API call
      console.log('Deleting timesheet:', id);
    }
  };

  // Format date range display
  const formatDateRange = (start: Date, end: Date) => {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  // Get status chip color
  const getStatusColor = (status: TimesheetStatus) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'submitted':
        return 'primary';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load timesheets. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search timesheets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={5} sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => {
                  // In a real app, this would navigate to create timesheet page
                  console.log('Create new timesheet');
                }}
              >
                New Timesheet
              </Button>
            </Grid>
          </Grid>
          
          {/* Week Navigation */}
          <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
            <Button
              variant="outlined"
              onClick={() => navigateWeek('prev')}
            >
              Previous Week
            </Button>
            
            <Typography variant="h6">
              {formatDateRange(dateRange.start, dateRange.end)}
            </Typography>
            
            <Button
              variant="outlined"
              onClick={() => navigateWeek('next')}
            >
              Next Week
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {/* Timesheets List */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total Hours</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Submitted On</TableCell>
                {user?.role === 'admin' && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTimesheets.length > 0 ? (
                filteredTimesheets.map((timesheet) => (
                  <TableRow key={timesheet.id} hover>
                    <TableCell>
                      {format(parseISO(timesheet.startDate), 'MMM d')} - {format(parseISO(timesheet.endDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                        color={getStatusColor(timesheet.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{timesheet.totalHours} hours</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '200px',
                        }}
                      >
                        {timesheet.notes || 'No notes'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {timesheet.createdAt ? format(parseISO(timesheet.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View">
                          <IconButton size="small" color="primary">
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {timesheet.status === 'draft' && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Submit">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleSubmitTimesheet(timesheet.id)}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        {user?.role === 'admin' && timesheet.status === 'submitted' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleApproveTimesheet(timesheet.id)}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleRejectTimesheet(timesheet.id)}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        {(timesheet.status === 'draft' || user?.role === 'admin') && (
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteTimesheet(timesheet.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={user?.role === 'admin' ? 6 : 5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No timesheets found matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default TimesheetList;
