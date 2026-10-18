import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  label: string;
  options: readonly { value: T; label: string; icon?: ReactNode }[];
}) {
  return (
    <View role="tablist" accessibilityLabel={label} style={styles.row}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="tab"
          aria-selected={value === option.value}
          accessibilityState={{ selected: value === option.value }}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => [
            styles.option,
            value === option.value && styles.selected,
            pressed && { opacity: 0.75 },
          ]}
        >
          {option.icon}
          <Text style={[styles.text, value === option.value && styles.selectedText]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 10,
    padding: 4,
    gap: 4,
    borderColor: Colors.borderSoft,
    borderWidth: 1,
  },
  option: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 5,
  },
  selected: { backgroundColor: Colors.surfaceRaised },
  text: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    flexShrink: 1,
  },
  selectedText: { color: Colors.text, fontFamily: Fonts.semiBold },
});
