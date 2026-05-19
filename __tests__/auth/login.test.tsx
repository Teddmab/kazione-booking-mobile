import { fireEvent, render, waitFor } from '@testing-library/react-native';

import LoginScreen from '@/app/(auth)/login';

const mockReplace = jest.fn();
const mockSignIn = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/lib/auth', () => ({
  signInWithEmail: (...args: unknown[]) => mockSignIn(...args),
  signInWithGoogle: jest.fn(),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSignIn.mockReset();
  });

  it('renders email, password, and sign-in button', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('shows error when signInWithEmail rejects', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } });
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'a@b.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrong');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('navigates to tabs on successful login', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'owner@afrotouch.ee');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'Test1234!');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });
});
