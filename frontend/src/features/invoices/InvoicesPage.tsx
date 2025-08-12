import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import InvoiceList from './InvoiceList';
import ProtectedRoute from '../../components/ProtectedRoute';

const InvoicesPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Invoices
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View, create, and manage your invoices. Track payment status and send reminders.
          </Typography>
        </Box>
        
        <InvoiceList />
      </Container>
    </ProtectedRoute>
  );
};

export default InvoicesPage;
