import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { GestureDetector, usePanGesture, type PanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { hoverSlot, slotsOf, slotsWithMove, type Slots } from '@/lib/utils/reorder';

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

/**
 * A list reordered by dragging each item's handle (see DragHandle). Items are placed by their slot
 * rather than by layout, so when a drop reorders `data` nothing on screen moves.
 */
export function DraggableList<T extends { id: string }>({
  data,
  renderItem,
  onReorder,
  onDragStart,
  onDragEnd,
}: Props<T>) {
  const total = data.length;
  const ids = data.map((item) => item.id);
  const idsKey = ids.join(',');

  const order = useSharedValue<string[]>(ids);
  const slots = useSharedValue<Slots>(slotsOf(ids));
  const activeId = useSharedValue<string | null>(null);
  const lastActiveId = useSharedValue<string | null>(null);
  const translateY = useSharedValue(0);

  // Follow the data. After a drop it already matches, so this changes nothing; after an add, a delete
  // or a VoiceOver move, items spring to their new slots.
  useEffect(() => {
    const next = idsKey ? idsKey.split(',') : [];
    order.set(next);
    slots.set(slotsOf(next));
  }, [idsKey, order, slots]);

  const drop = (from: number, to: number) => {
    onDragEnd?.();
    if (from !== to) onReorder(from, to);
  };
  const start = () => onDragStart?.();

  return (
    <View style={{ height: total * DRAG_ITEM_HEIGHT }}>
      {data.map((item, index) => (
        <DraggableItem
          key={item.id}
          id={item.id}
          index={index}
          order={order}
          slots={slots}
          activeId={activeId}
          lastActiveId={lastActiveId}
          translateY={translateY}
          onDragStart={start}
          onDrop={drop}
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

const DragGestureContext = createContext<PanGesture | null>(null);

/** Wrap an item's handle in this; dragging starts only from the handle. */
export function DragHandle({ children }: { children: ReactNode }) {
  const gesture = useContext(DragGestureContext);
  if (!gesture) return children;
  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}

interface ItemProps {
  id: string;
  index: number;
  order: SharedValue<string[]>;
  slots: SharedValue<Slots>;
  activeId: SharedValue<string | null>;
  lastActiveId: SharedValue<string | null>;
  translateY: SharedValue<number>;
  onDragStart: () => void;
  onDrop: (from: number, to: number) => void;
  children: React.ReactNode;
}

function DraggableItem({
  id,
  index,
  order,
  slots,
  activeId,
  lastActiveId,
  translateY,
  onDragStart,
  onDrop,
  children,
}: ItemProps) {
  const { colors } = useTheme();
  const from = useSharedValue(0);

  const gesture = usePanGesture({
    // A short hold, so a swipe that starts on the handle still scrolls the list.
    activateAfterLongPress: 150,
    hitSlop: { top: 12, bottom: 12, left: 16, right: 8 },
    onActivate: () => {
      'worklet';
      from.set(order.get().indexOf(id));
      activeId.set(id);
      lastActiveId.set(id);
      translateY.set(0);
      scheduleOnRN(onDragStart);
    },
    onUpdate: (e) => {
      'worklet';
      translateY.set(e.translationY);
      // Move the other items out of the way as the dragged one passes them.
      const to = hoverSlot(from.get(), e.translationY, DRAG_ITEM_HEIGHT, order.get().length);
      if (slots.get()[id] !== to) slots.set(slotsWithMove(order.get(), id, to));
    },
    onDeactivate: (e) => {
      'worklet';
      // A cancelled drag (e.g. an incoming call) puts everything back.
      const to = e.canceled ? from.get() : slots.get()[id];
      if (e.canceled) slots.set(slotsOf(order.get()));
      activeId.set(null);
      scheduleOnRN(onDrop, from.get(), to);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    const active = activeId.get() === id;
    // A row that was just added has no slot until the effect above runs; start it where it belongs.
    const top = (slots.get()[id] ?? index) * DRAG_ITEM_HEIGHT;
    return {
      // The dragged item follows the finger; on release it, and everything else, springs to its slot.
      top: active ? from.get() * DRAG_ITEM_HEIGHT + translateY.get() : withSpring(top, SPRING),
      // The most recently dragged item stays on top while it settles.
      zIndex: active ? 10 : lastActiveId.get() === id ? 1 : 0,
      opacity: active ? 0.92 : 1,
      shadowOpacity: active ? 0.12 : 0,
      elevation: active ? 6 : 0,
    };
  });

  return (
    <DragGestureContext.Provider value={gesture}>
      {/* Solid, so the shadow can be drawn efficiently. */}
      <Animated.View style={[styleBase, { backgroundColor: colors.background }, animatedStyle]}>
        {children}
      </Animated.View>
    </DragGestureContext.Provider>
  );
}

const styleBase = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: DRAG_ITEM_HEIGHT,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 8,
} as const;
