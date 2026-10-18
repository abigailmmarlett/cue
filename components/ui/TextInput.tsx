import { forwardRef } from 'react';
import { TextInput as RNTextInput, type TextInputProps } from 'react-native';
import { useMaxFontSizeMultiplier } from './Text';

/** React Native's TextInput with the same Dynamic Type cap as Text, so fields keep their layout. */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(props, ref) {
  const cap = useMaxFontSizeMultiplier();
  return <RNTextInput ref={ref} maxFontSizeMultiplier={cap} {...props} />;
});
