import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  CircularProgress, 
  Button,
  Card,
  CardContent,
  Divider,
  useTheme,
} from '@mui/material';
import { 
  AccessTime as TimeIcon, 
  List as ListIcon, 
  Receipt as InvoiceIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format, subDays, isToday } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for the dashboard - replace with actual API calls
const mockTimeEntries = [
  { id: 1, task: 'Project Setup', date: new Date(), duration: 120, project: 'Internal' },
  { id: 2, task: 'API Development', date: subDays(new Date(), 1), duration: 180, project: 'Client A' },
  { id: 3, task: 'UI Implementation', date: subDays(new Date(), 2), duration: 240, project: 'Client B' },
];

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const [currentProject, setCurrentProject] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Fetch recent time entries
  const { data: recentEntries, isLoading: isLoadingEntries } = useQuery({
    queryKey: ['recentTimeEntries'],
    queryFn: () => {
      // In a real app, this would be an API call
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(mockTimeEntries);
        }, 500);
      });
    },
  });

  // Fetch timesheet status
  const { data: timesheetStatus, isLoading: isLoadingTimesheet } = useQuery({
    queryKey: ['timesheetStatus'],
    queryFn: () => {
      // Mock data - replace with actual API call
      return new Promise(resolve => {
        setTimeout(() => ({
          currentWeek: {
            hours: 32.5,
            submitted: false,
            approved: false,
          },
          lastWeek: {
            hours: 40,
            submitted: true,
            approved: true,
          },
        }), 500);
      });
    },
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTracking && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        setElapsedTime(Math.floor(diff / 1000)); // Convert to seconds
      }, 1000);
    } else if (!isTracking && interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, startTime]);

  const handleStartTracking = () => {
    if (!currentTask) return;
    
    setIsTracking(true);
    setStartTime(new Date());
    setElapsedTime(0);
  };

  const handleStopTracking = async () => {
    if (!isTracking || !startTime) return;
    
    try {
      // In a real app, this would save the time entry to the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset the form
      setIsTracking(false);
      setCurrentTask('');
      setCurrentProject('');
      setStartTime(null);
      setElapsedTime(0);
      
      // Show success message or refresh data
    } catch (error) {
      console.error('Error saving time entry:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mock data for the chart
  const weeklyHours = [
    { name: 'Mon', hours: 6.5 },
    { name: 'Tue', hours: 7 },
    { name: 'Wed', hours: 5.5 },
    { name: 'Thu', hours: 8 },
    { name: 'Fri', hours: 5.5 },
    { name: 'Sat', hours: 0 },
    { name: 'Sun', hours: 0 },
  ];

  if (isLoadingEntries || isLoadingTimesheet) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.firstName}!
      </Typography>
      
      {/* Time Tracker */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Time Tracker
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="What are you working on?"
              variant="outlined"
              value={currentTask}
              onChange={(e) => setCurrentTask(e.target.value)}
              disabled={isTracking}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Project (optional)"
              variant="outlined"
              value={currentProject}
              onChange={(e) => setCurrentProject(e.target.value)}
              disabled={isTracking}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            {isTracking ? (
              <Box display="flex" alignItems="center">
                <Typography variant="h5" component="span" sx={{ mr: 2 }}>
                  {formatTime(elapsedTime)}
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={handleStopTracking}
                  sx={{ mr: 2 }}
                >
                  Stop
                </Button>
              </Box>
            ) : (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<StartIcon />}
                onClick={handleStartTracking}
                disabled={!currentTask.trim()}
                size="large"
              >
                Start Tracking
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      <Grid container spacing={3}>
        {/* Weekly Summary */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              This Week's Hours
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="hours" 
                    name="Hours Worked" 
                    fill={theme.palette.primary.main} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3} direction="column">
            <Grid item>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <TimeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      Today's Time
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div">
                    6.5 hrs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <ListIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      This Week
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div">
                    32.5 hrs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    5 days worked
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <InvoiceIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      Timesheet Status
                    </Typography>
                  </Box>
                  <Typography variant="body1" component="div" sx={{ mb: 1 }}>
                    Current Week: <strong>In Progress</strong>
                  </Typography>
                  <Typography variant="body1" component="div">
                    Last Week: <strong>Approved</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
      {/* Recent Time Entries */}
      <Box mt={4}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Recent Time Entries</Typography>
            <Button color="primary">View All</Button>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          {mockTimeEntries.map((entry) => (
            <Box 
              key={entry.id} 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              p={2}
              sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': { borderBottom: 'none' },
                bgcolor: isToday(entry.date) ? 'action.hover' : 'background.paper',
              }}
            >
              <Box>
                <Typography variant="subtitle1">{entry.task}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {entry.project} • {format(entry.date, 'MMM d, yyyy')}
                </Typography>
              </Box>
              <Typography variant="body1">
                {(entry.duration / 60).toFixed(1)} hours
              </Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    </Box>
  );
};

export default DashboardPage;
