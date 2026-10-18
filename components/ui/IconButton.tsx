import { TouchableOpacity, type TouchableOpacityProps } from 'react-native';

interface Props extends TouchableOpacityProps {
  /** What VoiceOver says, e.g. "Delete exercise". Required: the icon alone says nothing. */
  label: string;
}

/**
 * A button that shows only an icon or symbol. It has a spoken label, and its default hitSlop
 * stretches a ~20pt icon's touch area to Apple's 44pt minimum without changing the layout.
 */
export function IconButton({ label, hitSlop = 12, activeOpacity = 0.7, ...props }: Props) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={hitSlop}
      activeOpacity={activeOpacity}
      {...props}
    />
  );
}
