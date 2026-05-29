import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useStorefront } from '@/hooks/useStorefront';
import * as marketplaceService from '@/services/marketplaceService';

jest.mock('@/services/marketplaceService');

const mockStorefront = {
  id: '1',
  businessId: 'b1',
  slug: 'afrotouch',
  name: 'Afrotouch',
  tagline: null,
  description: 'Bio',
  extendedDescription: null,
  logoUrl: null,
  coverImageUrl: null,
  accentColor: '#E84E26',
  verified: true,
  currencyCode: 'EUR',
  countryCode: 'EE',
  headline: null,
  tags: [],
  categories: [],
  featured: true,
  rating: 4.5,
  reviewCount: 10,
  sections: {
    hero: true,
    about: true,
    services: true,
    promotions: true,
    gallery: true,
    team: true,
    reviews: false,
    booking: true,
  },
  contact: { address: null, city: 'Tallinn', countryCode: 'EE', phone: null, email: null, website: null },
  services: [{ id: 's1', name: 'Braids', category: 'Braids', categoryId: null, description: '', duration: '1 hrs', durationMin: 60, price: 50, currency: 'EUR', popular: true, imageUrl: null, displayOrder: 0 }],
  team: [],
  promotions: [],
  gallery: [],
};

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useStorefront', () => {
  it('does not fetch when slug is empty', () => {
    const spy = jest.spyOn(marketplaceService, 'getStorefront');
    renderHook(() => useStorefront(''), { wrapper });
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns storefront data for valid slug', async () => {
    jest.spyOn(marketplaceService, 'getStorefront').mockResolvedValue(mockStorefront);
    const { result } = renderHook(() => useStorefront('afrotouch'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Afrotouch');
  });
});
