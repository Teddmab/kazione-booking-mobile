import { fireEvent, render, waitFor } from '@testing-library/react-native';

import SignupScreen from '@/app/(auth)/signup';

const mockReplace = jest.fn();
const mockSignUp = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/lib/auth', () => ({
  signUpWithEmail: (...args: unknown[]) => mockSignUp(...args),
}));

describe('SignupScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSignUp.mockReset();
  });

  it('renders name, email, password fields', () => {
    const { getByPlaceholderText } = render(<SignupScreen />);
    expect(getByPlaceholderText('Your name')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Min. 6 characters')).toBeTruthy();
  });

  it('shows error on duplicate email', async () => {
    mockSignUp.mockResolvedValue({
      error: { message: 'User already registered' },
    });
    const { getByText, getByPlaceholderText } = render(<SignupScreen />);
    fireEvent.changeText(getByPlaceholderText('Your name'), 'Test');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'dup@test.com');
    fireEvent.changeText(getByPlaceholderText('Min. 6 characters'), 'secret');
    fireEvent.press(getByText('Create Account'));
    await waitFor(() => {
      expect(getByText(/already in use/i)).toBeTruthy();
    });
  });

  it('navigates to check-email on success', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText } = render(<SignupScreen />);
    fireEvent.changeText(getByPlaceholderText('Your name'), 'Test');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'new@test.com');
    fireEvent.changeText(getByPlaceholderText('Min. 6 characters'), 'secret');
    fireEvent.press(getByText('Create Account'));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/check-email');
    });
  });
});
