import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SignupScreen from '@/app/(auth)/signup';

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderSignup() {
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <SignupScreen />
    </SafeAreaProvider>,
  );
}

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockRegister = jest.fn();
const mockSignIn = jest.fn();
const mockInvalidate = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidate,
  }),
}));

jest.mock('@/lib/auth', () => ({
  registerBusinessOwner: (...args: unknown[]) => mockRegister(...args),
  signInWithEmail: (...args: unknown[]) => mockSignIn(...args),
}));

jest.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }),
    },
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { step?: number }) => {
      const map: Record<string, string> = {
        'auth.namePlaceholder': 'Your name',
        'auth.passwordMin8': 'Min. 8 characters',
        'auth.createAccount': 'Create Account',
        'auth.businessNamePlaceholder': 'Awesome Hair Studio',
        'auth.alreadyHaveAccount': 'Already have an account?',
        'auth.signIn': 'Sign in',
        'auth.emailInUse': 'Email already in use',
        'common.next': 'Next',
        'auth.fieldBusinessType': 'Business type',
        'auth.fieldCountry': 'Country',
        'auth.businessTypes.hair_salon': 'Hair Salon',
        'auth.countries.FR': 'France',
      };
      if (key === 'auth.signupStepOf' && opts?.step) return `Step ${opts.step} of 2`;
      return map[key] ?? key;
    },
  }),
}));

jest.mock('@/constants/logos', () => ({
  Logos: {
    orangeFull: 1,
    whiteFull: 1,
    blackFull: 1,
    iconOrange: 1,
    squareOrange: 1,
    squareWhite: 1,
  },
}));

function fillStep1(
  getByPlaceholderText: (s: string) => unknown,
  getAllByPlaceholderText: (s: string) => unknown[],
) {
  fireEvent.changeText(getByPlaceholderText('Your name'), 'Jane Doe');
  fireEvent.changeText(getByPlaceholderText('you@example.com'), 'owner@test.com');
  const passwordFields = getAllByPlaceholderText('Min. 8 characters');
  fireEvent.changeText(passwordFields[0], 'password12');
  fireEvent.changeText(passwordFields[1], 'password12');
}

describe('SignupScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockBack.mockClear();
    mockRegister.mockReset();
    mockSignIn.mockReset();
    mockInvalidate.mockClear();
    mockRegister.mockResolvedValue(undefined);
    mockSignIn.mockResolvedValue({ error: null });
  });

  it('renders step 1 account fields', () => {
    const { getByPlaceholderText } = renderSignup();
    expect(getByPlaceholderText('Your name')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
  });

  it('shows step 2 after continue without creating account', async () => {
    const { getByText, getByPlaceholderText, getAllByPlaceholderText } = renderSignup();
    fillStep1(getByPlaceholderText, getAllByPlaceholderText);
    fireEvent.press(getByText('Next'));
    await waitFor(() => {
      expect(getByPlaceholderText('Awesome Hair Studio')).toBeTruthy();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('registers owner on step 2 submit', async () => {
    const { getByText, getByPlaceholderText, getAllByPlaceholderText } = renderSignup();
    fillStep1(getByPlaceholderText, getAllByPlaceholderText);
    fireEvent.press(getByText('Next'));
    await waitFor(() => {
      expect(getByPlaceholderText('Awesome Hair Studio')).toBeTruthy();
    });
    fireEvent.changeText(getByPlaceholderText('Awesome Hair Studio'), 'Afrotouch');
    fireEvent.press(getByText('Create Account'));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'owner@test.com',
        password: 'password12',
        ownerName: 'Jane Doe',
        businessName: 'Afrotouch',
      });
      expect(mockSignIn).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('shows email in use and returns to step 1', async () => {
    const { ApiError } = require('@/lib/api');
    mockRegister.mockRejectedValue(new ApiError('EMAIL_TAKEN', 'taken', 409));

    const { getByText, getByPlaceholderText, getAllByPlaceholderText } = renderSignup();
    fillStep1(getByPlaceholderText, getAllByPlaceholderText);
    fireEvent.press(getByText('Next'));
    await waitFor(() => {
      expect(getByPlaceholderText('Awesome Hair Studio')).toBeTruthy();
    });
    fireEvent.changeText(getByPlaceholderText('Awesome Hair Studio'), 'Salon');
    fireEvent.press(getByText('Create Account'));
    await waitFor(() => {
      expect(getByText(/already in use/i)).toBeTruthy();
      expect(getByPlaceholderText('Your name')).toBeTruthy();
    });
  });
});
