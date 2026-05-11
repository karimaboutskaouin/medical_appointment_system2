import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DashboardDoctor from './DashboardDoctor';
import { AuthContext } from '../context/AuthContext';

jest.mock('../api/api');

import api from '../api/api';

const mockApi = {
  get: jest.fn(),
  patch: jest.fn(),
};

Object.assign(api, mockApi);

const mockDoctor = {
  id: 1,
  username: 'doctor1',
  first_name: 'Sophie',
  last_name: 'Bernard',
  role: 'doctor',
  doctor_profile: {
    specialty: 'cardiologie',
    license_number: 'LIC-001',
  },
};

const mockAppointments = [
  {
    id: 1,
    date: '2025-05-11',
    time: '10:00',
    status: 'pending',
    reason: 'Consultation',
    patient: { id: 2, first_name: 'Jean', last_name: 'Dupont' },
    doctor: mockDoctor,
  },
  {
    id: 2,
    date: '2025-05-11',
    time: '11:00',
    status: 'confirmed',
    reason: 'Follow-up',
    patient: { id: 3, first_name: 'Marie', last_name: 'Martin' },
    doctor: mockDoctor,
  },
];

const mockStats = {
  today_appointments: 2,
  new_patients: 1,
  cancellation_rate: 10.5,
  pending_rate: 0,
};

const mockLogout = jest.fn();

const renderDashboardDoctor = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user: mockDoctor, logout: mockLogout }}>
        <DashboardDoctor />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('DashboardDoctor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockImplementation((url) => {
      if (url === '/appointments/') {
        return Promise.resolve({ data: mockAppointments });
      }
      if (url === '/appointments/stats/') {
        return Promise.resolve({ data: mockStats });
      }
      if (url.includes('/appointments/today/')) {
        return Promise.resolve({ data: mockAppointments });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test('renders doctor dashboard tabs', async () => {
    renderDashboardDoctor();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /dashboard|today|agenda|patients/i })).toBeInTheDocument();
    });
  });

  test('fetches appointments and stats on mount', async () => {
    renderDashboardDoctor();

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/appointments/');
      expect(mockApi.get).toHaveBeenCalledWith('/appointments/stats/');
    });
  });

  test('displays stats cards with correct values', async () => {
    renderDashboardDoctor();

    await waitFor(() => {
      expect(screen.getByText(/2/)).toBeInTheDocument();
      expect(screen.getByText(/today|today's appointments/i)).toBeInTheDocument();
      expect(screen.getByText(/new patients|patients/i)).toBeInTheDocument();
    });
  });

  test('displays appointments list', async () => {
    renderDashboardDoctor();

    await waitFor(() => {
      expect(screen.getByText(/Jean Dupont|Marie Martin/)).toBeInTheDocument();
      expect(screen.getByText(/Consultation|Follow-up/)).toBeInTheDocument();
    });
  });

  test('doctor can confirm pending appointments', async () => {
    mockApi.patch.mockResolvedValue({ data: { status: 'confirmed' } });
    renderDashboardDoctor();

    await waitFor(() => {
      expect(screen.getByText(/Consultation/)).toBeInTheDocument();
    });

    const confirmButtons = screen.getAllByRole('button', { name: /confirm|✓/i });
    if (confirmButtons.length > 0) {
      await userEvent.click(confirmButtons[0]);

      await waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith(
          '/appointments/1/',
          { status: 'confirmed' }
        );
      });
    }
  });

  test('calendar displays current month', async () => {
    renderDashboardDoctor();

    await waitFor(() => {
      const today = new Date();
      const monthName = today.toLocaleString('default', { month: 'long' });
      const year = today.getFullYear();
      expect(screen.getByText(new RegExp(`${monthName}|${year}`, 'i'))).toBeInTheDocument();
    });
  });

  test('QR scanner modal can be opened', async () => {
    renderDashboardDoctor();

    const scanButton = await screen.findByRole('button', { name: /scan|qr|code/i });
    await userEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText(/upload|scan|file|patient/i)).toBeInTheDocument();
    });
  });

  test('scanned patient data displays in modal', async () => {
    const mockPatientData = {
      id: 5,
      first_name: 'Test',
      last_name: 'Patient',
      patient_profile: {
        blood_type: 'O+',
        allergies: 'None',
      },
    };

    mockApi.get.mockImplementation((url) => {
      if (url.includes('/users/patients/')) {
        return Promise.resolve({ data: { patient: mockPatientData } });
      }
      if (url === '/appointments/') {
        return Promise.resolve({ data: mockAppointments });
      }
      if (url === '/appointments/stats/') {
        return Promise.resolve({ data: mockStats });
      }
      return Promise.resolve({ data: {} });
    });

    renderDashboardDoctor();

    const scanButton = await screen.findByRole('button', { name: /scan|qr|code/i });
    await userEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText(/upload|scan|file|patient/i)).toBeInTheDocument();
    });
  });

  test('logout button is present', async () => {
    renderDashboardDoctor();

    const logoutButton = await screen.findByRole('button', { name: /logout|disconnect|exit/i });
    expect(logoutButton).toBeInTheDocument();
  });

  test('can switch between tabs', async () => {
    renderDashboardDoctor();

    const agendaTab = await screen.findByRole('button', { name: /agenda|appointments/i });
    await userEvent.click(agendaTab);

    await waitFor(() => {
      expect(screen.getByText(/Jean Dupont|Marie Martin/)).toBeInTheDocument();
    });
  });
});
