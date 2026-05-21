import { fireEvent, render } from '@testing-library/react-native';

import { SalonCard } from '@/components/salon/SalonCard';
import type { SalonListItem } from '@/types/marketplace';

const mockSalon: SalonListItem = {
  id: '1',
  slug: 'afrotouch',
  name: 'Afrotouch',
  logo_url: null,
  cover_image_url: null,
  rating: 4.8,
  review_count: 12,
  city: 'Tallinn',
  top_services: ['Braids', 'Weaves'],
  is_featured: true,
  categories: ['Braids'],
};

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

describe('SalonCard', () => {
  it('renders name, rating, and city', () => {
    const { getByText } = render(<SalonCard salon={mockSalon} onPress={jest.fn()} />);
    expect(getByText('Afrotouch')).toBeTruthy();
    expect(getByText(/4\.8/)).toBeTruthy();
    expect(getByText(/Tallinn/)).toBeTruthy();
  });

  it('calls onPress when card pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<SalonCard salon={mockSalon} onPress={onPress} />);
    fireEvent.press(getByText('Afrotouch'));
    expect(onPress).toHaveBeenCalled();
  });

  it('shows Featured badge when is_featured', () => {
    const { getByText } = render(<SalonCard salon={mockSalon} onPress={jest.fn()} />);
    expect(getByText('Featured')).toBeTruthy();
  });
});
