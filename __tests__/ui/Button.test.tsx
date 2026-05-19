import { fireEvent, render } from '@testing-library/react-native';

import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders label text', () => {
    const { getByText } = render(<Button label="Sign In" onPress={() => {}} />);
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap" onPress={onPress} />);
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap" onPress={onPress} disabled />);
    fireEvent.press(getByText('Tap'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(
      <Button label="Hidden" onPress={() => {}} loading />,
    );
    expect(queryByText('Hidden')).toBeNull();
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });
});
