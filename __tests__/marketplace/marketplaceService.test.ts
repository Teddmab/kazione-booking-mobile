import { api } from '@/lib/api';
import { getMarketplace } from '@/services/marketplaceService';

jest.mock('@/lib/api', () => ({
  api: { get: jest.fn() },
}));

const mockSalon = {
  id: '1',
  business_id: 'b1',
  slug: 'afrotouch',
  title: 'Afrotouch',
  tagline: null,
  logo_url: null,
  cover_image_url: null,
  city: 'Tallinn',
  marketplace_categories: ['Braids'],
  marketplace_tags: [],
  marketplace_headline: null,
  avg_rating: 4.5,
  review_count: 10,
  services_preview: [],
};

describe('getMarketplace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns storefronts from API', async () => {
    (api.get as jest.Mock).mockResolvedValue({ storefronts: [mockSalon], total: 1 });
    const result = await getMarketplace({ page: 1, limit: 10 });
    expect(result.storefronts).toHaveLength(1);
    expect(result.storefronts[0].slug).toBe('afrotouch');
  });

  it('includes search and category in query path', async () => {
    (api.get as jest.Mock).mockResolvedValue({ storefronts: [], total: 0 });
    await getMarketplace({ search: 'braid', categories: ['Braids'], page: 2, limit: 10 });
    const path = (api.get as jest.Mock).mock.calls[0][0] as string;
    expect(path).toContain('search=braid');
    expect(path).toContain('categories=Braids');
    expect(path).toContain('page=2');
  });
});
