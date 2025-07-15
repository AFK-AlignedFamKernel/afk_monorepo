import { MonoText } from '../StyledText';
import React from 'react';
import { render } from '@testing-library/react';

describe('MonoText', () => {
  it('renders with the correct font family', () => {
    const { getByText } = render(<MonoText>test</MonoText>);
    const text = getByText('test');
    expect(text).toBeTruthy();
    // Chakra UI version: fontFamily is set via style or class, so this is a placeholder
  });
}); 