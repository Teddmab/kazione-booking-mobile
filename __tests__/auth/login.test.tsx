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
        'auth.heroTitle': 'Your salon, elevated.',
        'auth.heroSubtitle': 'Built for beauty businesses.',
        'auth.businessPortal': 'Business portal',
        'auth.welcomeBack': 'Welcome back',
        'auth.signInOwnerSubtitle': 'Sign in to your salon dashboard',
        'auth.tabHintBusiness': 'For owners, managers, staff',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.forgotPassword': 'Forgot password?',
        'auth.showPassword': 'Show',
        'auth.hidePassword': 'Hide',
        'auth.signIn': 'Sign in',
        'auth.signingIn': 'Signing in…',
        'auth.newToKazione': 'New to KaziOne?',
        'auth.createBusinessAccount': 'Create a business account',
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

  it('renders owner login form', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('owner@salon.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
    expect(getByText('Sign in')).toBeTruthy();
    expect(getByText('Business portal')).toBeTruthy();
  });

  it('calls submit on sign in', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('owner@salon.com'), 'owner@afrotouch.ee');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'Test1234!');
    fireEvent.press(getByText('Sign in'));
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('owner@afrotouch.ee', 'Test1234!');
    });
  });
});
