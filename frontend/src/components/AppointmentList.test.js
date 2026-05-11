import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentList from './AppointmentList';

describe('AppointmentList Component', () => {
  const mockAppointments = [
    {
      id: 1,
      date: '2025-12-01',
      time: '10:00',
      status: 'pending',
      reason: 'General checkup',
      patient: { id: 1, first_name: 'Jean', last_name: 'Dupont' },
      doctor: { id: 2, first_name: 'Sophie', last_name: 'Bernard' },
    },
    {
      id: 2,
      date: '2025-12-05',
      time: '14:00',
      status: 'confirmed',
      reason: 'Follow-up',
      patient: { id: 1, first_name: 'Jean', last_name: 'Dupont' },
      doctor: { id: 2, first_name: 'Sophie', last_name: 'Bernard' },
    },
    {
      id: 3,
      date: '2025-12-10',
      time: '09:00',
      status: 'cancelled',
      reason: 'Consultation',
      patient: { id: 3, first_name: 'Marie', last_name: 'Martin' },
      doctor: { id: 2, first_name: 'Sophie', last_name: 'Bernard' },
    },
    {
      id: 4,
      date: '2025-12-15',
      time: '11:00',
      status: 'completed',
      reason: 'Checkup',
      patient: { id: 1, first_name: 'Jean', last_name: 'Dupont' },
      doctor: { id: 2, first_name: 'Sophie', last_name: 'Bernard' },
    },
  ];

  const mockOnCancel = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays appointments correctly', () => {
    render(
      <AppointmentList
        appointments={mockAppointments}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        role="patient"
      />
    );

    mockAppointments.forEach((apt) => {
      expect(screen.getByText(new RegExp(apt.reason))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(apt.date))).toBeInTheDocument();
    });
  });

  test('shows doctor name for patient view', () => {
    render(
      <AppointmentList
        appointments={mockAppointments}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        role="patient"
      />
    );

    expect(screen.getAllByText(/Sophie Bernard/)).toHaveLength(4);
  });

  test('shows patient name for doctor view', () => {
    render(
      <AppointmentList
        appointments={mockAppointments}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        role="doctor"
      />
    );

    expect(screen.getByText(/Jean Dupont/)).toBeInTheDocument();
    expect(screen.getByText(/Marie Martin/)).toBeInTheDocument();
  });

  test('shows status badges', () => {
    render(
      <AppointmentList
        appointments={mockAppointments}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        role="patient"
      />
    );

    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  test('doctor can confirm pending appointments', async () => {
    render(
      <AppointmentList
        appointments={[mockAppointments[0]]}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        role="doctor"
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm|✓/i });
    await userEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith(1);
  });

  test('patient can cancel pending appointments', async () => {
    render(
      <AppointmentList
        appointments={[mockAppointments[0]]}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        role="patient"
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledWith(1);
  });

  test('patient can cancel confirmed appointments', async () => {
    render(
      <AppointmentList
        appointments={[mockAppointments[1]]}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        role="patient"
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledWith(2);
  });

  test('hides action buttons for cancelled appointments', () => {
    render(
      <AppointmentList
        appointments={[mockAppointments[2]]}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        role="patient"
      />
    );

    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  test('hides action buttons for completed appointments', () => {
    render(
      <AppointmentList
        appointments={[mockAppointments[3]]}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        role="patient"
      />
    );

    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  test('only shows confirm button for doctors on pending appointments', () => {
    const pendingApt = mockAppointments[0];
    const { queryByRole: patientQuery } = render(
      <AppointmentList
        appointments={[pendingApt]}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        role="patient"
      />
    );

    expect(patientQuery('button', { name: /confirm|✓/i })).not.toBeInTheDocument();
  });

  test('renders empty state when no appointments', () => {
    render(
      <AppointmentList
        appointments={[]}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        role="patient"
      />
    );

    expect(screen.getByText(/no appointments|empty/i)).toBeInTheDocument();
  });
});
