import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';

export type WheelOption = {
  label: string;
  value: string;
};

type Props = {
  value: string;
  options: WheelOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const ITEM_HEIGHT = 44;
const VISIBLE = 5;
const PAD = Math.floor(VISIBLE / 2);

export function WheelPicker({ value, options, onChange, disabled, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const scrollRef = useRef<ScrollView>(null);
  const wheelH = ITEM_HEIGHT * VISIBLE;
  const popAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) setDraft(value);
  }, [value, open]);

  const scrollToDraft = (animated = false) => {
    const idx = options.findIndex(o => o.value === draft);
    if (idx < 0) return;
    scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated });
  };

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => scrollToDraft(false), 60);
    return () => clearTimeout(t);
  }, [open, draft, options]);

  useEffect(() => {
    if (!open) return;
    Animated.parallel([
      Animated.spring(popAnim, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, popAnim, fadeAnim]);

  const closePicker = () => {
    Animated.parallel([
      Animated.timing(popAnim, { toValue: 0.92, duration: 140, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(() => setOpen(false));
  };

  const openPicker = () => {
    if (disabled) return;
    setDraft(value);
    popAnim.setValue(0.92);
    fadeAnim.setValue(0);
    setOpen(true);
  };

  const pickFromScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.max(0, Math.min(options.length - 1, Math.round(y / ITEM_HEIGHT)));
    if (options[idx]) setDraft(options[idx].value);
  };

  const confirm = () => {
    onChange(draft);
    closePicker();
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={openPicker}
        activeOpacity={disabled ? 1 : 0.75}
      >
        <Text
          style={[styles.fieldText, !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder ?? 'Select'}
        </Text>
        {!disabled ? (
          <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
        ) : null}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" onRequestClose={closePicker}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePicker} />

          <Animated.View
            style={[
              styles.popLayer,
              {
                opacity: fadeAnim,
                transform: [{ scale: popAnim }],
              },
            ]}
          >
            <BlurView intensity={72} tint="light" style={styles.glassSheet}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={closePicker} hitSlop={12}>
                  <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirm} hitSlop={12}>
                  <Text style={styles.done}>Done</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.wheelWrap, { height: wheelH }]}>
                <View
                  pointerEvents="none"
                  style={[styles.highlight, { top: PAD * ITEM_HEIGHT, height: ITEM_HEIGHT }]}
                />
                <ScrollView
                  ref={scrollRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  nestedScrollEnabled
                  onMomentumScrollEnd={pickFromScroll}
                  onScrollEndDrag={pickFromScroll}
                  onContentSizeChange={() => scrollToDraft(false)}
                  contentContainerStyle={{ paddingVertical: PAD * ITEM_HEIGHT }}
                >
                  {options.map(item => {
                    const active = item.value === draft;
                    return (
                      <View key={item.value} style={styles.item}>
                        <Text
                          style={[styles.label, active ? styles.labelActive : styles.labelInactive]}
                          numberOfLines={2}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </BlurView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 252, 245, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 48,
  },
  fieldDisabled: {
    opacity: 0.55,
  },
  fieldText: {
    flex: 1,
    fontSize: 15,
    color: colors.foreground,
    fontWeight: '500',
    marginRight: 8,
  },
  placeholder: {
    color: colors.mutedForeground,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(37, 50, 56, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  popLayer: {
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.22,
        shadowRadius: 28,
      },
      android: { elevation: 24 },
    }),
  },
  glassSheet: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    backgroundColor: 'rgba(255, 252, 245, 0.55)',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37, 50, 56, 0.1)',
  },
  cancel: {
    fontSize: 16,
    color: colors.mutedForeground,
  },
  done: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
  },
  wheelWrap: {
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  highlight: {
    position: 'absolute',
    left: 8,
    right: 8,
    backgroundColor: 'rgba(12, 106, 115, 0.14)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(12, 106, 115, 0.35)',
    zIndex: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 15,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.secondary,
    fontWeight: '700',
  },
  labelInactive: {
    color: colors.mutedForeground,
    fontWeight: '400',
  },
});
