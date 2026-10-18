import React, { useCallback } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export const DRAG_ITEM_HEIGHT = 88;

const SPRING = { damping: 20, stiffness: 200, mass: 0.5 };

/** Moves an item one place up (-1) or down (+1), for VoiceOver users who can't drag. */
export interface ItemMover {
  canMove: (direction: -1 | 1) => boolean;
  move: (direction: -1 | 1) => void;
}

interface Props<T extends { id: string }> {
  data: T[];
  renderItem: (item: T, index: number, mover: ItemMover) => React.ReactNode;
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
          {renderItem(item, index, {
            canMove: (direction) => index + direction >= 0 && index + direction < total,
            move: (direction) => {
              const to = index + direction;
              if (to < 0 || to >= total) return;
              onReorder(index, to);
              // Queued, so VoiceOver re-reading the moved handle doesn't cut it off.
              AccessibilityInfo.announceForAccessibilityWithOptions(`Moved to position ${to + 1} of ${total}`, {
                queue: true,
              });
            },
          })}
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

function DraggableItem({ index, total, activeIndex, translateY, onDragStart, onReorder, children }: ItemProps) {
  const gesture = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart(() => {
      activeIndex.set(index);
      translateY.set(0);
      scheduleOnRN(onDragStart);
    })
    .onUpdate((e) => {
      translateY.set(e.translationY);
    })
    .onEnd(() => {
      const from = activeIndex.get();
      const rawTo = from + translateY.get() / DRAG_ITEM_HEIGHT;
      const to = Math.round(Math.max(0, Math.min(rawTo, total - 1)));

      activeIndex.set(-1);
      translateY.set(withSpring(0, SPRING));

      scheduleOnRN(onReorder, from, to);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const active = activeIndex.get();

    if (active === -1) {
      return {
        transform: [{ translateY: withSpring(0, SPRING) }],
        zIndex: 0,
        opacity: 1,
      };
    }

    if (active === index) {
      return {
        transform: [{ translateY: translateY.get() }],
        zIndex: 10,
        opacity: 0.92,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
      };
    }

    const hoverIdx = Math.round(Math.max(0, Math.min(active + translateY.get() / DRAG_ITEM_HEIGHT, total - 1)));

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
      <Animated.View style={[{ height: DRAG_ITEM_HEIGHT }, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}
