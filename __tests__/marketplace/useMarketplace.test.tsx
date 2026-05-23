import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useMarketplace } from '@/hooks/useMarketplace';
import * as marketplaceService from '@/services/marketplaceService';

jest.mock('@/services/marketplaceService');

const mockSalon = {
  id: '1',
  business_id: 'b1',
  slug: 'afrotouch',
  title: 'Afrotouch',
  tagline: null,
  logo_url: null,
  cover_image_url: null,
  city: 'Tallinn',
  marketplace_categories: [],
  marketplace_tags: [],
  marketplace_headline: null,
  avg_rating: 5,
  review_count: 1,
  services_preview: [],
};

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useMarketplace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns data when API succeeds', async () => {
    jest.spyOn(marketplaceService, 'getMarketplace').mockResolvedValue({
      storefronts: [mockSalon],
      total: 1,
    });
    const { result } = renderHook(() => useMarketplace({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].storefronts).toHaveLength(1);
  });

  it('passes category to getMarketplace', async () => {
    const spy = jest.spyOn(marketplaceService, 'getMarketplace').mockResolvedValue({
      storefronts: [],
      total: 0,
    });
    const { result } = renderHook(() => useMarketplace({ category: 'Braids' }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ categories: ['Braids'] }),
    );
  });
});
