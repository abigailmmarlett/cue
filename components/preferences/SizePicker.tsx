import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useSettingsStyles } from './styles';

type Size = 'small' | 'default' | 'large';

const SIZES: Size[] = ['small', 'default', 'large'];

interface Props {
  /** Spoken before the size, e.g. "Text size". */
  label: string;
  value: Size;
  onChange: (size: Size) => void;
}

/** Settings: an S / M / L choice. */
export function SizePicker({ label, value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useSettingsStyles();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {SIZES.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              styles.timingChip,
              active && { backgroundColor: colors.fill.primary, borderColor: colors.fill.primary },
            ]}
            onPress={() => onChange(opt)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 3, right: 3 }}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${opt === 'default' ? 'medium' : opt}`}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.timingChipText, active && { color: colors.text.onFill }]}>
              {opt === 'small' ? 'S' : opt === 'default' ? 'M' : 'L'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
