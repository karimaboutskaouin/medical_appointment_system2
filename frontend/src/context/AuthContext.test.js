import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from './AuthContext';
import { useContext } from 'react';

jest.mock('../api/api');

import api from '../api/api';

const mockApi = {
  post: jest.fn(),
  get: jest.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
};

Object.assign(api, mockApi);

const useAuthHook = () => {
  return useContext(AuthContext);
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('provides auth state', () => {
    const { result } = renderHook(() => useAuthHook(), {
      wrapper: AuthProvider,
    });

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('token');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('register');
    expect(result.current).toHaveProperty('logout');
  });

  test('login calls API and stores token', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        tokens: {
          access: 'test-access-token',
          refresh: 'test-refresh-token',
        },
      },
    });

    mockApi.get.mockResolvedValueOnce({
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'patient',
      },
    });

    const { result } = renderHook(() => useAuthHook(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login('testuser', 'testpass123');
    });

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/users/login/', {
        username: 'testuser',
        password: 'testpass123',
      });
      expect(localStorage.getItem('access_token')).toBe('test-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('test-refresh-token');
    });
  });

  test('login fetches and sets user profile', async () => {
    const userData = {
      id: 1,
      username: 'testuser',
      email: 'test@test.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'patient',
    };

    mockApi.post.mockResolvedValueOnce({
      data: {
        tokens: {
          access: 'test-token',
          refresh: 'test-refresh',
        },
      },
    });

    mockApi.get.mockResolvedValueOnce({
      data: userData,
    });

    const { result } = renderHook(() => useAuthHook(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login('testuser', 'testpass123');
    });

    await waitFor(() => {
      expect(result.current.user).toMatchObject(userData);
    });
  });

  test('register calls API and logs in user', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        tokens: {
          access: 'test-token',
          refresh: 'test-refresh',
        },
      },
    });

    mockApi.get.mockResolvedValueOnce({
      data: {
        id: 1,
        username: 'newuser',
        role: 'patient',
      },
    });

    const { result } = renderHook(() => useAuthHook(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.register({
        username: 'newuser',
        email: 'new@test.com',
        password: 'Pass123!',
        password2: 'Pass123!',
        role: 'patient',
      });
    });

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/users/register/', expect.any(Object));
      expect(result.current.user).toBeDefined();
    });
  });

  test('logout clears token and user', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        tokens: {
          access: 'test-token',
          refresh: 'test-refresh',
        },
      },
    });

    mockApi.get.mockResolvedValueOnce({
      data: { id: 1, username: 'testuser', role: 'patient' },
    });

    const { result } = renderHook(() => useAuthHook(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login('testuser', 'testpass');
    });

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
    });

    await act(async () => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  test('token is persisted to localStorage', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        tokens: {
          access: 'persistent-token',
          refresh: 'persistent-refresh',
        },
      },
    });

    mockApi.get.mockResolvedValueOnce({
      data: { id: 1, username: 'testuser', role: 'patient' },
    });

    const { result } = renderHook(() => useAuthHook(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login('testuser', 'testpass');
    });

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('persistent-token');
      expect(localStorage.getItem('refresh_token')).toBe('persistent-refresh');
    });
  });

  test('loads token from localStorage on mount', async () => {
    localStorage.setItem('access_token', 'stored-token');
    localStorage.setItem('refresh_token', 'stored-refresh');

    mockApi.get.mockResolvedValueOnce({
      data: { id: 1, username: 'storeduser', role: 'patient' },
    });

    const { result } = renderHook(() => useAuthHook(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.token).toBe('stored-token');
      expect(mockApi.get).toHaveBeenCalledWith('/users/profile/');
    });
  });

  test('handles API error in login', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuthHook(), {
      wrapper: AuthProvider,
    });

    await expect(
      act(async () => {
        await result.current.login('testuser', 'wrong');
      })
    ).rejects.toThrow('Invalid credentials');

    expect(result.current.user).toBeNull();
  });
});
