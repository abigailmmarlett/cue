import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';

export const DRAG_ITEM_HEIGHT = 72;

const SPRING = { damping: 20, stiffness: 200, mass: 0.5 };

interface Props<T extends { id: string }> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onReorder: (from: number, to: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function DraggableList<T extends { id: string }>({
  data,
  renderItem,
  onReorder,
  onDragStart,
  onDragEnd,
}: Props<T>) {
  const activeIndex = useSharedValue(-1);
  const translateY = useSharedValue(0);
  const total = data.length;

  const handleReorder = useCallback(
    (from: number, to: number) => {
      onDragEnd?.();
      if (from !== to) onReorder(from, to);
    },
    [onDragEnd, onReorder]
  );

  const handleDragStart = useCallback(() => {
    onDragStart?.();
  }, [onDragStart]);

  return (
    <View>
      {data.map((item, index) => (
        <DraggableItem
          key={item.id}
          index={index}
          total={total}
          activeIndex={activeIndex}
          translateY={translateY}
          onDragStart={handleDragStart}
          onReorder={handleReorder}
        >
          {renderItem(item, index)}
        </DraggableItem>
      ))}
    </View>
  );
}

interface ItemProps {
  index: number;
  total: number;
  activeIndex: SharedValue<number>;
  translateY: SharedValue<number>;
  onDragStart: () => void;
  onReorder: (from: number, to: number) => void;
  children: React.ReactNode;
}

function DraggableItem({
  index,
  total,
  activeIndex,
  translateY,
  onDragStart,
  onReorder,
  children,
}: ItemProps) {
  const gesture = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart(() => {
      activeIndex.value = index;
      translateY.value = 0;
      runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      const from = activeIndex.value;
      const rawTo = from + translateY.value / DRAG_ITEM_HEIGHT;
      const to = Math.round(Math.max(0, Math.min(rawTo, total - 1)));

      activeIndex.value = -1;
      translateY.value = withSpring(0, SPRING);

      runOnJS(onReorder)(from, to);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const active = activeIndex.value;

    if (active === -1) {
      return {
        transform: [{ translateY: withSpring(0, SPRING) }],
        zIndex: 0,
        opacity: 1,
      };
    }

    if (active === index) {
      return {
        transform: [{ translateY: translateY.value }],
        zIndex: 10,
        opacity: 0.92,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
      };
    }

    const hoverIdx = Math.round(
      Math.max(0, Math.min(active + translateY.value / DRAG_ITEM_HEIGHT, total - 1))
    );

    let shift = 0;
    if (active < hoverIdx && index > active && index <= hoverIdx) {
      shift = -DRAG_ITEM_HEIGHT;
    } else if (active > hoverIdx && index >= hoverIdx && index < active) {
      shift = DRAG_ITEM_HEIGHT;
    }

    return {
      transform: [{ translateY: withSpring(shift, SPRING) }],
      zIndex: 0,
      opacity: 1,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ height: DRAG_ITEM_HEIGHT }, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
