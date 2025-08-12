import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import TimesheetList from './TimesheetList';
import ProtectedRoute from '../../components/ProtectedRoute';

const TimesheetsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Timesheets
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your timesheets. Submit timesheets for approval or review past submissions.
          </Typography>
        </Box>
        
        <TimesheetList />
      </Container>
    </ProtectedRoute>
  );
};

export default TimesheetsPage;
