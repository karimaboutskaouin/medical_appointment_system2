import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DashboardPatient from './DashboardPatient';
import { AuthContext } from '../context/AuthContext';

jest.mock('../api/api');

import api from '../api/api';

const mockApi = {
  get: jest.fn(),
  patch: jest.fn(),
  post: jest.fn(),
};

Object.assign(api, mockApi);

const mockUser = {
  id: 1,
  username: 'patient1',
  first_name: 'Jean',
  last_name: 'Dupont',
  role: 'patient',
  patient_profile: {
    blood_type: 'O+',
    allergies: 'Penicillin',
    medical_history: 'Asthma',
  },
};

const mockAppointments = [
  {
    id: 1,
    date: '2025-12-01',
    time: '10:00',
    status: 'confirmed',
    reason: 'Consultation cardiologie',
    doctor: { id: 2, first_name: 'Sophie', last_name: 'Bernard' },
    patient: mockUser,
  },
  {
    id: 2,
    date: '2025-12-05',
    time: '14:00',
    status: 'pending',
    reason: 'Follow-up',
    doctor: { id: 2, first_name: 'Sophie', last_name: 'Bernard' },
    patient: mockUser,
  },
];

const mockDoctors = [
  { id: 2, first_name: 'Sophie', last_name: 'Bernard', doctor_profile: { specialty: 'cardiologie' } },
  { id: 3, first_name: 'Marc', last_name: 'Dupre', doctor_profile: { specialty: 'dentiste' } },
];

const mockLogout = jest.fn();

const renderDashboardPatient = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user: mockUser, logout: mockLogout }}>
        <DashboardPatient />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('DashboardPatient Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockImplementation((url) => {
      if (url === '/appointments/') {
        return Promise.resolve({ data: mockAppointments });
      }
      if (url === '/users/doctors/') {
        return Promise.resolve({ data: mockDoctors });
      }
      return Promise.resolve({ data: [] });
    });
  });

  test('renders dashboard tabs', async () => {
    renderDashboardPatient();

    await waitFor(() => {
      expect(screen.getByText(/home|dashboard/i)).toBeInTheDocument();
    });
  });

  test('fetches appointments on mount', async () => {
    renderDashboardPatient();

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/appointments/');
    });
  });

  test('displays upcoming appointments', async () => {
    renderDashboardPatient();

    await waitFor(() => {
      expect(screen.getByText(/Sophie Bernard/)).toBeInTheDocument();
      expect(screen.getByText(/Consultation cardiologie/)).toBeInTheDocument();
    });
  });

  test('doctor search filters by name', async () => {
    renderDashboardPatient();

    const searchInput = await screen.findByPlaceholderText(/search|doctor/i);
    await userEvent.type(searchInput, 'Sophie');

    await waitFor(() => {
      expect(screen.getByText(/Sophie Bernard/)).toBeInTheDocument();
      expect(screen.queryByText(/Marc Dupre/)).not.toBeInTheDocument();
    });
  });

  test('doctor search filters by specialty', async () => {
    renderDashboardPatient();

    const searchInput = await screen.findByPlaceholderText(/search|doctor/i);
    await userEvent.type(searchInput, 'cardiologie');

    await waitFor(() => {
      expect(screen.getByText(/Sophie Bernard/)).toBeInTheDocument();
    });
  });

  test('appointment booking button opens modal', async () => {
    renderDashboardPatient();

    const bookButton = await screen.findByRole('button', { name: /book|new appointment|create/i });
    await userEvent.click(bookButton);

    await waitFor(() => {
      expect(screen.getByText(/doctor/i, { selector: 'label' })).toBeInTheDocument();
    });
  });

  test('cancel appointment with confirmation', async () => {
    mockApi.patch.mockResolvedValue({ data: { status: 'cancelled' } });
    window.confirm = jest.fn(() => true);

    renderDashboardPatient();

    await waitFor(() => {
      expect(screen.getByText(/Consultation cardiologie/)).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    if (cancelButtons.length > 0) {
      await userEvent.click(cancelButtons[0]);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(mockApi.patch).toHaveBeenCalled();
      });
    }
  });

  test('QR code modal displays when opened', async () => {
    renderDashboardPatient();

    const qrButton = await screen.findByRole('button', { name: /qr|code|médical/i });
    await userEvent.click(qrButton);

    await waitFor(() => {
      expect(screen.getByText(/patient.*data|qr code/i)).toBeInTheDocument();
    });
  });

  test('medical file modal shows patient information', async () => {
    renderDashboardPatient();

    const dossierButton = await screen.findByRole('button', { name: /dossier|medical file|profile/i });
    await userEvent.click(dossierButton);

    await waitFor(() => {
      expect(screen.getByText(/Jean Dupont|blood type|allergies/i)).toBeInTheDocument();
    });
  });

  test('logout button is present and clickable', async () => {
    renderDashboardPatient();

    const logoutButton = await screen.findByRole('button', { name: /logout|disconnect|exit/i });
    expect(logoutButton).toBeInTheDocument();
  });
});
