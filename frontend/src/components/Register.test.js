import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';
import { AuthContext } from '../context/AuthContext';

const mockRegister = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderRegister = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ register: mockRegister, user: null, loading: false }}>
        <Register />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form with basic fields', () => {
    renderRegister();
    expect(screen.getByLabelText(/Nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Prénom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mot de passe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Vous êtes/i)).toBeInTheDocument();
  });

  test('shows doctor-specific fields when role is doctor', async () => {
    renderRegister();
    const roleSelect = screen.getByLabelText(/Vous êtes/i);

    await userEvent.selectOptions(roleSelect, 'doctor');

    await waitFor(() => {
      expect(screen.getByLabelText(/Spécialité/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/N° de licence/i)).toBeInTheDocument();
    });
  });

  test('hides doctor-specific fields when role is patient', async () => {
    renderRegister();
    const roleSelect = screen.getByLabelText(/Vous êtes/i);

    await userEvent.selectOptions(roleSelect, 'doctor');
    await waitFor(() => {
      expect(screen.getByLabelText(/Spécialité/i)).toBeInTheDocument();
    });

    await userEvent.selectOptions(roleSelect, 'patient');
    await waitFor(() => {
      expect(screen.queryByLabelText(/Spécialité/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/N° de licence/i)).not.toBeInTheDocument();
    });
  });

  test('shows error when passwords do not match', async () => {
    renderRegister();

    await userEvent.type(screen.getByLabelText(/^Mot de passe/i), 'Pass123!');
    await userEvent.type(screen.getByLabelText(/Confirmer/i), 'Different123!');
    await userEvent.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    await waitFor(() => {
      expect(screen.getByText(/Les mots de passe ne correspondent pas/i)).toBeInTheDocument();
    });
  });

  test('calls register API with patient data', async () => {
    mockRegister.mockResolvedValue({ success: true });
    renderRegister();

    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/i), 'newpatient');
    await userEvent.type(screen.getByLabelText(/Email/i), 'patient@test.com');
    await userEvent.type(screen.getByLabelText(/Prénom/i), 'Jean');
    await userEvent.type(screen.getByLabelText(/Nom$/i), 'Dupont');
    await userEvent.type(screen.getByLabelText(/^Mot de passe/i), 'Pass123!');
    await userEvent.type(screen.getByLabelText(/Confirmer/i), 'Pass123!');

    const roleSelect = screen.getByLabelText(/Vous êtes/i);
    await userEvent.selectOptions(roleSelect, 'patient');

    await userEvent.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
        username: 'newpatient',
        email: 'patient@test.com',
        first_name: 'Jean',
        last_name: 'Dupont',
        password: 'Pass123!',
        password2: 'Pass123!',
        role: 'patient',
      }));
    });
  });

  test('calls register API with doctor data including specialty and license', async () => {
    mockRegister.mockResolvedValue({ success: true });
    renderRegister();

    const roleSelect = screen.getByLabelText(/Vous êtes/i);
    await userEvent.selectOptions(roleSelect, 'doctor');

    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/i), 'newdoctor');
    await userEvent.type(screen.getByLabelText(/Email/i), 'doctor@test.com');
    await userEvent.type(screen.getByLabelText(/Prénom/i), 'Sophie');
    await userEvent.type(screen.getByLabelText(/Nom$/i), 'Bernard');
    await userEvent.type(screen.getByLabelText(/^Mot de passe/i), 'Pass123!');
    await userEvent.type(screen.getByLabelText(/Confirmer/i), 'Pass123!');

    await waitFor(() => {
      expect(screen.getByLabelText(/Spécialité/i)).toBeInTheDocument();
    });

    const specialtySelect = screen.getByLabelText(/Spécialité/i);
    await userEvent.selectOptions(specialtySelect, 'cardiologie');
    await userEvent.type(screen.getByLabelText(/N° de licence/i), 'LIC-12345');

    await userEvent.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
        role: 'doctor',
        specialty: 'cardiologie',
        license_number: 'LIC-12345',
      }));
    });
  });

  test('navigates to dashboard on successful registration', async () => {
    mockRegister.mockResolvedValue({ success: true });
    renderRegister();

    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/i), 'newuser');
    await userEvent.type(screen.getByLabelText(/Email/i), 'user@test.com');
    await userEvent.type(screen.getByLabelText(/Prénom/i), 'Test');
    await userEvent.type(screen.getByLabelText(/Nom$/i), 'User');
    await userEvent.type(screen.getByLabelText(/^Mot de passe/i), 'Pass123!');
    await userEvent.type(screen.getByLabelText(/Confirmer/i), 'Pass123!');

    await userEvent.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('shows link to login page', () => {
    renderRegister();
    expect(screen.getByRole('link', { name: /Se connecter/i })).toBeInTheDocument();
  });
});
