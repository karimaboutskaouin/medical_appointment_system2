import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentForm from './AppointmentForm';

jest.mock('../api/api');

import api from '../api/api';

const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
};

Object.assign(api, mockApi);

const mockOnSuccess = jest.fn();
const mockOnClose = jest.fn();

describe('AppointmentForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockResolvedValue({
      data: [
        { id: 1, first_name: 'Sophie', last_name: 'Bernard', doctor_profile: { specialty: 'cardiologie' } },
        { id: 2, first_name: 'Marc', last_name: 'Dupre', doctor_profile: { specialty: 'dentiste' } },
      ],
    });
  });

  test('fetches and displays doctor list on mount', async () => {
    render(<AppointmentForm onSuccess={mockOnSuccess} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/users/doctors/');
      expect(screen.getByText(/Sophie Bernard/)).toBeInTheDocument();
      expect(screen.getByText(/Marc Dupre/)).toBeInTheDocument();
    });
  });

  test('renders doctor selection dropdown', async () => {
    render(<AppointmentForm onSuccess={mockOnSuccess} onClose={mockOnClose} />);

    await waitFor(() => {
      const doctorSelect = screen.getByLabelText(/Médecin/i);
      expect(doctorSelect).toBeInTheDocument();
    });
  });

  test('renders date picker with minimum date as today', async () => {
    render(<AppointmentForm onSuccess={mockOnSuccess} onClose={mockOnClose} />);

    await waitFor(() => {
      const dateInput = screen.getByLabelText(/Date/i);
      expect(dateInput).toBeInTheDocument();
      const today = new Date().toISOString().split('T')[0];
      expect(dateInput).toHaveAttribute('min', today);
    });
  });

  test('renders time selection', async () => {
    render(<AppointmentForm onSuccess={mockOnSuccess} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Heure/i)).toBeInTheDocument();
    });
  });

  test('renders reason textarea', async () => {
    render(<AppointmentForm onSuccess={mockOnSuccess} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Motif de consultation/i)).toBeInTheDocument();
    });
  });

  test('form submission creates appointment and calls onSuccess', async () => {
    mockApi.post.mockResolvedValue({ data: { id: 1, status: 'pending' } });
    render(<AppointmentForm onSuccess={mockOnSuccess} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/Sophie Bernard/)).toBeInTheDocument();
    });

    const doctorSelect = screen.getByLabelText(/Médecin/i);
    await userEvent.selectOptions(doctorSelect, '1');

    const dateInput = screen.getByLabelText(/Date/i);
    await userEvent.type(dateInput, '2025-12-01');

    const timeSelect = screen.getByLabelText(/Heure/i);
    await userEvent.selectOptions(timeSelect, '10:00');

    const reasonTextarea = screen.getByLabelText(/Motif de consultation/i);
    await userEvent.type(reasonTextarea, 'Consultation cardiologie');

    const submitButton = screen.getByRole('button', { name: /Confirmer le RDV/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/appointments/', expect.objectContaining({
        doctor: '1',
        date: '2025-12-01',
        reason: 'Consultation cardiologie',
      }));
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('cancel button calls onClose', async () => {
    render(<AppointmentForm onSuccess={mockOnSuccess} onClose={mockOnClose} />);

    const cancelButton = screen.getByRole('button', { name: /Annuler/i });
    await userEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('handles API error gracefully', async () => {
    mockApi.post.mockRejectedValue(new Error('API Error'));
    render(<AppointmentForm onSuccess={mockOnSuccess} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/Sophie Bernard/)).toBeInTheDocument();
    });

    const doctorSelect = screen.getByLabelText(/Médecin/i);
    await userEvent.selectOptions(doctorSelect, '1');

    const dateInput = screen.getByLabelText(/Date/i);
    await userEvent.type(dateInput, '2025-12-01');

    const timeSelect = screen.getByLabelText(/Heure/i);
    await userEvent.selectOptions(timeSelect, '10:00');

    const submitButton = screen.getByRole('button', { name: /Confirmer le RDV/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Erreur lors de la création/i)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
});
