import { useAuthStore } from '@/store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      session: null,
      user: null,
      role: null,
      isLoading: true,
    });
  });

  it('initial state has isLoading true', () => {
    expect(useAuthStore.getState().isLoading).toBe(true);
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().role).toBeNull();
  });

  it('setSession updates session and user', () => {
    const mockUser = { id: 'u1', email: 'test@test.com' } as never;
    const mockSession = { user: mockUser } as never;
    useAuthStore.getState().setSession(mockSession);
    expect(useAuthStore.getState().session).toBe(mockSession);
    expect(useAuthStore.getState().user).toBe(mockUser);
  });

  it('clearSession resets all fields', () => {
    useAuthStore.getState().setRole('owner');
    useAuthStore.getState().clearSession();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().role).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('setRole updates role', () => {
    useAuthStore.getState().setRole('staff');
    expect(useAuthStore.getState().role).toBe('staff');
  });
});
