import { fireEvent, render, waitFor } from '@testing-library/react-native';

import LoginScreen from '@/app/(auth)/login';

const mockPush = jest.fn();
const mockSubmit = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'auth.heroTitle': 'Your day, on the floor.',
        'auth.heroSubtitle': 'Built for salon staff.',
        'auth.staffPortal': 'Staff portal',
        'auth.welcomeBack': 'Welcome back',
        'auth.signInStaffSubtitle': 'Sign in with your staff account',
        'auth.tabHintStaff': 'For salon staff only',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.forgotPassword': 'Forgot password?',
        'auth.showPassword': 'Show',
        'auth.hidePassword': 'Hide',
        'auth.signIn': 'Sign in',
        'auth.signingIn': 'Signing in…',
      })[key] ?? key,
  }),
}));

jest.mock('@/hooks/useAuthLogin', () => ({
  useAuthLogin: () => ({
    submit: mockSubmit,
    loading: false,
    error: null,
  }),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSubmit.mockReset();
  });

  it('renders staff login form', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('staff@salon.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
    expect(getByText('Sign in')).toBeTruthy();
    expect(getByText('Staff portal')).toBeTruthy();
  });

  it('calls submit on sign in', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('staff@salon.com'), 'staff@afrotouch.ee');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'Test1234!');
    fireEvent.press(getByText('Sign in'));
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('staff@afrotouch.ee', 'Test1234!');
    });
  });
});
