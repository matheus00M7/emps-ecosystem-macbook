import { X } from 'lucide-react-native';
import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';

export function AppSheet({
  visible,
  title,
  onClose,
  children,
}: PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
}>) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [lastContent, setLastContent] = useState({ title, children });
  const [progress] = useState(() => new Animated.Value(0));
  const reducedMotion = useRef(false);
  if (visible && !mounted) setMounted(true);
  // Keep the content present while the closing animation finishes.
  if (visible && (lastContent.children !== children || lastContent.title !== title))
    setLastContent({ title, children });

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) reducedMotion.current = value;
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      reducedMotion.current = value;
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reducedMotion.current ? 0 : visible ? 240 : 160,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [progress, visible]);

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} animationType="none">
      <View style={styles.host}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
          <Pressable
            accessibilityLabel="Fechar janela"
            accessibilityRole="button"
            onPress={onClose}
            style={styles.backdrop}
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 20),
              opacity: progress,
              transform: [
                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {visible ? title : lastContent.title}
            </Text>
            <Pressable
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.close}
            >
              <X color={Colors.textMuted} size={22} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {visible ? children : lastContent.children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingTop: 60 },
  backdrop: { flex: 1, backgroundColor: '#00000099' },
  sheet: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 24,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 18, flex: 1 },
  close: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  body: { padding: 24, gap: 20 },
});
