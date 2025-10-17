import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ViewInvoice from '../ViewInvoice';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ invoiceId: 'test-id' }),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../services/api', () => ({
  invoicesAPI: {
    getWithLineItems: jest.fn().mockResolvedValue({
      invoice: {
        invoice_num: 100,
        invoice_date: '2025-10-31',
        client_name: 'Test Client',
      },
      line_items: [],
    }),
  },
}));

describe('ViewInvoice', () => {
  it('renders brand as dangan and hides static company details', async () => {
    render(<ViewInvoice />);
    const brand = await screen.findByTestId('invoice-brand');
    expect(brand).toHaveTextContent('dangan');

    // Ensure removed static details are not present
    expect(screen.queryByText('Company Holdings Limited')).not.toBeInTheDocument();
    expect(screen.queryByText('Serpentine Business Centre')).not.toBeInTheDocument();
    expect(screen.queryByText('086 607 2114')).not.toBeInTheDocument();
    expect(screen.queryByText('finance@company.com')).not.toBeInTheDocument();
    expect(screen.queryByText('www.company.com')).not.toBeInTheDocument();
  });
});


