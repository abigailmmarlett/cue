import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { setPreference } from '@/lib/db/preferences';
import db from '@/lib/db/client';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetId?: string;
  navigateTo?: string;
  condition?: 'has-sequences';
}

export interface HighlightLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TourContextValue {
  isActive: boolean;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: TourStep | null;
  highlightLayout: HighlightLayout | null;
  registerTarget: (id: string, ref: React.RefObject<View | null>) => void;
  unregisterTarget: (id: string) => void;
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  isActive: false,
  currentStepIndex: 0,
  totalSteps: 0,
  currentStep: null,
  highlightLayout: null,
  registerTarget: () => {},
  unregisterTarget: () => {},
  startTour: () => {},
  nextStep: () => {},
  skipTour: () => {},
});

const ALL_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Cue',
    description: "A workout sequencer built for coaches who move. Let's take a quick look around.",
  },
  {
    id: 'sequences',
    title: 'Your Sequences',
    description: 'All your workout sequences live here. Each card is a complete routine with sections, exercises, timings, and loads.',
    targetId: 'sequences-list',
  },
  {
    id: 'add-sequence',
    title: 'Build a Sequence',
    description: 'Tap + to create a new sequence. Add sections, exercises, set durations, and assign load indicators.',
    targetId: 'add-button',
  },
  {
    id: 'tag-filter',
    title: 'Tags & Filtering',
    description: 'Add tags to sequences in the builder, then filter here to quickly find the right workout for any session.',
    targetId: 'tag-filter',
  },
  {
    id: 'sequence-card',
    title: 'Sequence Cards',
    description: 'Tap to view or edit. Long-press for options — duplicate, share, or delete. Hit ▶ to launch the workout timer with haptic cues at every transition.',
    targetId: 'first-sequence-card',
    condition: 'has-sequences',
  },
  {
    id: 'library',
    title: 'Exercise Library',
    description: 'Your reusable exercise library. Create exercises once — with variations, load presets, and bilateral tracking — and use them across any sequence.',
    targetId: 'library-content',
    navigateTo: '/library',
  },
  {
    id: 'preferences',
    title: 'Make It Yours',
    description: 'Themes, haptic patterns, timer behavior, and text sizes — customize Cue to fit your coaching style.',
    targetId: 'preferences-content',
    navigateTo: '/preferences',
  },
  {
    id: 'done',
    title: "You're Ready, Coach",
    description: "That's everything. Now go build something great.",
    navigateTo: '/',
  },
];

function buildActiveSteps(): TourStep[] {
  try {
    const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM sequences');
    const hasSeqs = (row?.count ?? 0) > 0;
    return ALL_TOUR_STEPS.filter((s) => {
      if (s.condition === 'has-sequences') return hasSeqs;
      return true;
    });
  } catch {
    return ALL_TOUR_STEPS.filter((s) => s.condition !== 'has-sequences');
  }
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [isActive, _setIsActive] = useState(false);
  const [currentStepIndex, _setCurrentStepIndex] = useState(0);
  const [activeSteps, _setActiveSteps] = useState<TourStep[]>([]);
  const [highlightLayout, setHighlightLayout] = useState<HighlightLayout | null>(null);

  // Refs kept in sync with state for use inside closures without stale values.
  const isActiveRef = useRef(false);
  const stepIndexRef = useRef(0);
  const activeStepsRef = useRef<TourStep[]>([]);

  const setIsActive = (v: boolean) => { isActiveRef.current = v; _setIsActive(v); };
  const setCurrentStepIndex = (v: number) => { stepIndexRef.current = v; _setCurrentStepIndex(v); };
  const setActiveSteps = (v: TourStep[]) => { activeStepsRef.current = v; _setActiveSteps(v); };

  const targetRefs = useRef<Map<string, React.RefObject<View | null>>>(new Map());
  const pendingTargetId = useRef<string | null>(null);
  const isTransitioning = useRef(false);

  const measureAndShow = useCallback((targetId: string) => {
    const ref = targetRefs.current.get(targetId);
    if (!ref?.current) return;
    ref.current.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setHighlightLayout({ x, y, width, height });
      } else {
        // Element exists but has zero size (e.g. tag filter with no tags) — show without highlight
        setHighlightLayout(null);
      }
    });
  }, []);

  const showStep = useCallback((stepIndex: number, steps: TourStep[]) => {
    isTransitioning.current = false;
    const step = steps[stepIndex];
    if (!step?.targetId) {
      setHighlightLayout(null);
      return;
    }
    // Small delay to allow layout to settle after navigation or state update.
    setTimeout(() => measureAndShow(step.targetId!), 100);
  }, [measureAndShow]);

  const registerTarget = useCallback((id: string, ref: React.RefObject<View | null>) => {
    targetRefs.current.set(id, ref);
    if (isActiveRef.current && pendingTargetId.current === id) {
      pendingTargetId.current = null;
      setTimeout(() => showStep(stepIndexRef.current, activeStepsRef.current), 200);
    }
  }, [showStep]);

  const unregisterTarget = useCallback((id: string) => {
    targetRefs.current.delete(id);
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
    setHighlightLayout(null);
    isTransitioning.current = false;
    setPreference('hasTakenTour', 'true');
  }, []);

  const skipTour = useCallback(() => completeTour(), [completeTour]);

  const nextStep = useCallback(() => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    const nextIndex = stepIndexRef.current + 1;
    const steps = activeStepsRef.current;

    if (nextIndex >= steps.length) {
      completeTour();
      return;
    }

    const nextStepData = steps[nextIndex];
    setHighlightLayout(null);
    setCurrentStepIndex(nextIndex);

    if (nextStepData.navigateTo) {
      if (nextStepData.targetId) {
        pendingTargetId.current = nextStepData.targetId;
      }
      router.replace(nextStepData.navigateTo as any);
      if (!nextStepData.targetId) {
        // No target to wait for — clear transitioning after nav settles.
        setTimeout(() => { isTransitioning.current = false; }, 350);
      }
    } else {
      setTimeout(() => showStep(nextIndex, steps), 200);
    }
  }, [router, completeTour, showStep]);

  const startTour = useCallback(() => {
    const steps = buildActiveSteps();
    setActiveSteps(steps);
    setCurrentStepIndex(0);
    setHighlightLayout(null);
    isTransitioning.current = false;
    pendingTargetId.current = null;
    router.replace('/');
    setIsActive(true);
  }, [router]);

  const value: TourContextValue = {
    isActive,
    currentStepIndex,
    totalSteps: activeSteps.length,
    currentStep: activeSteps[currentStepIndex] ?? null,
    highlightLayout,
    registerTarget,
    unregisterTarget,
    startTour,
    nextStep,
    skipTour,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  return useContext(TourContext);
}
