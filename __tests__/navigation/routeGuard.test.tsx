import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AuthGate } from '@/components/AuthGate';

const mockReplace = jest.fn();
const mockSegments = jest.fn<string[]>(() => ['(tabs)']);

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSegments: () => mockSegments(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = jest.requireMock('@/contexts/AuthContext');

describe('AuthGate', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSegments.mockReturnValue(['(tabs)']);
  });

  it('redirects unauthenticated user to login', async () => {
    useAuth.mockReturnValue({ session: null, isLoading: false, role: null });
    render(
      <AuthGate>
        <Text>Protected</Text>
      </AuthGate>,
    );
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('redirects authenticated user away from auth screens', async () => {
    mockSegments.mockReturnValue(['(auth)', 'login']);
    useAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isLoading: false,
      role: 'client',
    });
    render(
      <AuthGate>
        <Text>Auth</Text>
      </AuthGate>,
    );
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
