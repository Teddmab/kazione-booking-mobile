import { fireEvent, render, waitFor } from '@testing-library/react-native';

import LoginScreen from '@/app/(auth)/login';

const mockSignIn = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/lib/auth', () => ({
  signInWithEmail: (...args: unknown[]) => mockSignIn(...args),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
  });

  it('renders work email, password, and sign-in button', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('owner@yoursalon.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('shows team-focused heading and subheading', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Sign in to KaziOne')).toBeTruthy();
    expect(getByText('For owners, managers, staff, and reception')).toBeTruthy();
  });

  it('shows error when signInWithEmail returns an error', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } });
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('owner@yoursalon.com'), 'a@b.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrong');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('calls signInWithEmail with trimmed email and password', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('owner@yoursalon.com'), '  owner@afrotouch.ee  ');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'Test1234!');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('owner@afrotouch.ee', 'Test1234!');
    });
  });

  it('shows network error when signInWithEmail throws', async () => {
    mockSignIn.mockRejectedValue(new Error('Network timeout'));
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('owner@yoursalon.com'), 'a@b.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'pass');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(getByText('Network timeout')).toBeTruthy();
    });
  });
});
