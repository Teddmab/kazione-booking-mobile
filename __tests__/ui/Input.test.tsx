import { fireEvent, render } from '@testing-library/react-native';

import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders label above input', () => {
    const { getByText } = render(
      <Input label="Email" placeholder="you@example.com" value="" onChangeText={() => {}} />,
    );
    expect(getByText('Email')).toBeTruthy();
  });

  it('shows error message when error prop set', () => {
    const { getByText } = render(
      <Input
        placeholder="x"
        value=""
        onChangeText={() => {}}
        error="Invalid email"
      />,
    );
    expect(getByText('Invalid email')).toBeTruthy();
  });

  it('calls onChangeText on text input', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Type here" value="" onChangeText={onChangeText} />,
    );
    fireEvent.changeText(getByPlaceholderText('Type here'), 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });
});
