import { render } from '@testing-library/react-native';

import SignupScreen from '@/app/(auth)/signup';

const mockRedirect = jest.fn();

jest.mock('expo-router', () => ({
  Redirect: (props: { href: string }) => {
    mockRedirect(props.href);
    return null;
  },
}));

describe('SignupScreen', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it('redirects owner signup to staff login', () => {
    render(<SignupScreen />);
    expect(mockRedirect).toHaveBeenCalledWith('/(auth)/login');
  });
});
