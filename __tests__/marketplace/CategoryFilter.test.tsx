import { fireEvent, render } from '@testing-library/react-native';

import { CategoryFilter } from '@/components/marketplace/CategoryFilter';

describe('CategoryFilter', () => {
  it('renders All and 7 category pills', () => {
    const { getByText } = render(<CategoryFilter selected={undefined} onSelect={jest.fn()} />);
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Braids')).toBeTruthy();
    expect(getByText('Massage')).toBeTruthy();
  });

  it('calls onSelect with category when pill tapped', () => {
    const onSelect = jest.fn();
    const { getByText } = render(<CategoryFilter selected={undefined} onSelect={onSelect} />);
    fireEvent.press(getByText('Braids'));
    expect(onSelect).toHaveBeenCalledWith('Braids');
  });

  it('calls onSelect(undefined) when All tapped', () => {
    const onSelect = jest.fn();
    const { getByText } = render(<CategoryFilter selected="Braids" onSelect={onSelect} />);
    fireEvent.press(getByText('All'));
    expect(onSelect).toHaveBeenCalledWith(undefined);
  });
});
