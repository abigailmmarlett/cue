import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/lib/contexts/ThemeContext';

// "hey, coach!" in Pacifico 46px — glyph outlines extracted via opentype.js
// BBox: x1=2.44, y1=-43.24, x2=214.87, y2=20.93 (width=212.43, height=64.17)
const HEY_COACH_PATH =
  'M27.7-10.3Q28.3-10.3 28.7-9.7Q29-9.2 29-8.2Q29-6.3 28.2-5.3Q26-2.9 23.8-1.3Q21.6 0.2 18.7 0.2Q16.4 0.2 15.2-1.1Q14-2.5 14-5.1Q14-6.3 14.6-9.7Q15.2-12.6 15.2-13.7Q15.2-14.4 14.7-14.4Q14.1-14.4 13-12.9Q11.9-11.3 10.8-8.8Q9.7-6.3 9-3.4Q8.1 0.2 4.7 0.2Q3.3 0.2 2.9-0.8Q2.4-1.7 2.4-4.3Q2.4-5.8 2.5-6.7L2.5-10.3Q2.5-17.4 4-25.1Q5.4-32.8 8.3-38Q11.1-43.2 15-43.2Q17.2-43.2 18.5-41.4Q19.8-39.6 19.8-36.7Q19.8-32.1 17.1-27.1Q14.4-22.1 8.2-15.4Q8.1-13 8.1-10.5Q9.6-14.4 11.5-16.9Q13.3-19.3 15.2-20.4Q17-21.4 18.5-21.4Q21.5-21.4 21.5-18.4Q21.5-16.7 20.5-12Q19.6-8 19.6-6.7Q19.6-4.8 20.9-4.8Q21.8-4.8 23.1-6Q24.4-7.1 26.5-9.6Q27-10.3 27.7-10.3M14.1-38.7Q13.2-38.7 12.2-36.3Q11.2-33.9 10.3-29.9Q9.3-25.9 8.7-21.2Q11.6-24.5 13.5-28.5Q15.3-32.4 15.3-35.6Q15.3-37.1 15-37.9Q14.7-38.7 14.1-38.7M45.8-10.3Q46.4-10.3 46.8-9.7Q47.1-9.2 47.1-8.2Q47.1-6.3 46.2-5.3Q44.5-3.3 41.4-1.5Q38.3 0.2 34.8 0.2Q29.9 0.2 27.3-2.4Q24.6-5 24.6-9.6Q24.6-12.7 25.9-15.5Q27.3-18.2 29.6-19.8Q32-21.4 35-21.4Q37.7-21.4 39.3-19.8Q40.9-18.3 40.9-15.5Q40.9-12.4 38.6-10.1Q36.3-7.8 30.9-6.5Q32.1-4.4 35.3-4.4Q37.4-4.4 40-5.8Q42.6-7.3 44.6-9.6Q45.1-10.3 45.8-10.3M34.2-16.9Q32.5-16.9 31.3-14.9Q30.2-13 30.2-10.2L30.2-10.1Q32.9-10.7 34.5-12Q36-13.3 36-15Q36-15.9 35.5-16.4Q35.1-16.9 34.2-16.9M66.9-10.2Q67.5-10.2 67.9-9.6Q68.2-9 68.2-8.1Q68.2-7.1 67.9-6.5Q67.6-5.9 66.9-5.4L58.1 0.5Q56.3 10 53.5 15.5Q50.6 20.9 46.3 20.9Q43.9 20.9 42.5 19.5Q41 18 41 15.7Q41 13.5 42 11.3Q43 9 45.7 6.1Q48.3 3.2 53.3-0.6L53.4-1.7Q53.7-3.4 54.1-6.5Q53.2-3.2 51.6-1.5Q49.9 0.2 48.1 0.2Q46 0.2 44.7-1.7Q43.4-3.6 43.4-6.4Q43.4-9.9 43.8-12.8Q44.3-15.6 45.4-18.9Q45.8-20.2 46.6-20.8Q47.5-21.4 49.3-21.4Q50.3-21.4 50.7-21.1Q51.1-20.8 51.1-20.1Q51.1-19.8 50.6-17.7Q50.1-16 49.8-14.6Q49.5-12.7 49.2-11Q48.9-9.2 48.9-8.1Q48.9-6.4 49.9-6.4Q50.6-6.4 51.6-7.8Q52.6-9.2 53.8-12Q55-14.8 56.1-18.9Q56.4-20.2 57.2-20.8Q58-21.4 59.5-21.4Q60.5-21.4 61-21.2Q61.4-20.9 61.4-20.2Q61.4-19.1 60.2-12.3L59-4.9Q62.5-7.6 65.9-9.8Q66.5-10.2 66.9-10.2M46.8 16.5Q47.9 16.5 49.4 13.8Q50.8 11.1 52.2 4.9Q48.7 7.9 47.1 10.4Q45.5 12.8 45.5 14.7Q45.5 15.5 45.8 16Q46.1 16.5 46.8 16.5M71.2 7.3Q70.2 7.3 69.6 6.8Q69 6.3 69 5.3Q69 4.9 69.1 4.4Q69.6 2.3 69.9 0.5Q70.1-1.3 70.1-3.5Q70.1-5.8 71.2-7.1Q72.3-8.3 74-8.3Q75.7-8.3 76.5-7.4Q77.4-6.5 77.4-5Q77.4-3.4 76.4-0.7Q75.4 1.9 74.1 4.5Q73.1 6.2 72.6 6.7Q72.1 7.3 71.2 7.3M103.3 0.2Q98.8 0.2 96.3-2.3Q93.7-4.9 93.7-9.1Q93.7-12.8 95.2-15.6Q96.7-18.4 99-19.9Q101.4-21.4 104-21.4Q106.5-21.4 107.9-19.9Q109.3-18.4 109.3-16.1Q109.3-14.2 108.4-12.8Q107.6-11.5 106.2-11.5Q105.3-11.5 104.8-11.9Q104.3-12.3 104.3-13.1Q104.3-13.4 104.4-13.8Q104.5-14.2 104.5-14.4Q104.7-15.1 104.7-15.7Q104.7-16.3 104.4-16.6Q104.1-16.9 103.6-16.9Q102.5-16.9 101.6-16Q100.7-15 100.1-13.4Q99.6-11.8 99.6-9.9Q99.6-4.6 104.2-4.6Q106.1-4.6 108.3-5.8Q110.5-7.1 112.6-9.6Q113.2-10.3 113.8-10.3Q114.4-10.3 114.8-9.7Q115.1-9.2 115.1-8.2Q115.1-6.4 114.3-5.3Q112.1-2.7 109.1-1.2Q106.1 0.2 103.3 0.2M134.9-14.1Q135.5-14.1 135.8-13.5Q136.1-12.9 136.1-12Q136.1-9.8 134.8-9.4Q132-8.4 128.7-8.3Q127.8-4.4 125.3-2.1Q122.7 0.2 119.4 0.2Q116.7 0.2 114.7-1.1Q112.7-2.4 111.7-4.6Q110.7-6.9 110.7-9.4Q110.7-12.9 112.1-15.7Q113.4-18.4 115.7-19.9Q118.1-21.5 120.9-21.5Q124.4-21.5 126.6-19.1Q128.7-16.7 129.1-13.1Q131.2-13.2 134.2-14Q134.6-14.1 134.9-14.1M119.8-4.6Q121.3-4.6 122.3-5.8Q123.4-7 123.8-9.3Q122.4-10.3 121.6-11.8Q120.8-13.4 120.8-15.1Q120.8-15.9 121-16.6L120.8-16.6Q118.9-16.6 117.7-14.8Q116.5-13.1 116.5-9.8Q116.5-7.3 117.5-6Q118.4-4.6 119.8-4.6M137.8 0.2Q135 0.2 133.3-1.8Q131.6-3.9 131.6-7.3Q131.6-10.9 133.3-14.2Q135-17.5 137.8-19.5Q140.6-21.5 143.8-21.5Q144.8-21.5 145.2-21.1Q145.5-20.7 145.7-19.7Q146.7-19.9 147.8-19.9Q150-19.9 150-18.3Q150-17.3 149.3-13.7Q148.3-8.4 148.3-6.3Q148.3-5.7 148.6-5.2Q148.9-4.8 149.5-4.8Q150.4-4.8 151.6-6Q152.9-7.1 155-9.6Q155.5-10.3 156.2-10.3Q156.8-10.3 157.2-9.7Q157.5-9.2 157.5-8.2Q157.5-6.3 156.6-5.3Q154.7-3 152.6-1.4Q150.5 0.2 148.5 0.2Q147 0.2 145.8-0.8Q144.5-1.8 143.8-3.6Q141.4 0.2 137.8 0.2M139.5-4.4Q140.5-4.4 141.4-5.6Q142.3-6.8 142.7-8.8L144.4-17.2Q142.5-17.2 140.9-15.8Q139.2-14.4 138.3-12.1Q137.3-9.8 137.3-7.2Q137.3-5.8 137.9-5.1Q138.5-4.4 139.5-4.4M162.6 0.2Q158.1 0.2 155.5-2.3Q153-4.9 153-9.1Q153-12.8 154.5-15.6Q156-18.4 158.3-19.9Q160.7-21.4 163.3-21.4Q165.8-21.4 167.2-19.9Q168.6-18.4 168.6-16.1Q168.6-14.2 167.7-12.8Q166.9-11.5 165.5-11.5Q164.6-11.5 164.1-11.9Q163.6-12.3 163.6-13.1Q163.6-13.4 163.7-13.8Q163.8-14.2 163.8-14.4Q164-15.1 164-15.7Q164-16.3 163.7-16.6Q163.4-16.9 162.9-16.9Q161.8-16.9 160.9-16Q160-15 159.4-13.4Q158.9-11.8 158.9-9.9Q158.9-4.6 163.5-4.6Q165.4-4.6 167.6-5.8Q169.8-7.1 171.9-9.6Q172.5-10.3 173.1-10.3Q173.7-10.3 174.1-9.7Q174.4-9.2 174.4-8.2Q174.4-6.4 173.6-5.3Q171.4-2.7 168.4-1.2Q165.4 0.2 162.6 0.2M196.2-10.3Q196.8-10.3 197.2-9.7Q197.5-9.2 197.5-8.2Q197.5-6.3 196.6-5.3Q194.5-2.9 192.3-1.3Q190.1 0.2 187.2 0.2Q184.9 0.2 183.7-1.1Q182.5-2.5 182.5-5.1Q182.5-6.3 183.1-9.7Q183.7-12.6 183.7-13.7Q183.7-14.4 183.2-14.4Q182.6-14.4 181.5-12.9Q180.4-11.3 179.3-8.8Q178.2-6.3 177.5-3.4Q176.6 0.2 173.2 0.2Q171.8 0.2 171.4-0.8Q170.9-1.7 170.9-4.3Q170.9-5.8 171-6.7L171-10.3Q171-17.4 172.5-25.1Q173.9-32.8 176.8-38Q179.6-43.2 183.5-43.2Q185.7-43.2 187-41.4Q188.3-39.6 188.3-36.7Q188.3-32.1 185.6-27.1Q182.8-22.1 176.7-15.4Q176.6-13 176.6-10.5Q178.1-14.4 180-16.9Q181.8-19.3 183.7-20.4Q185.5-21.4 187-21.4Q190-21.4 190-18.4Q190-16.7 189-12Q188.1-8 188.1-6.7Q188.1-4.8 189.4-4.8Q190.3-4.8 191.6-6Q192.9-7.1 195-9.6Q195.5-10.3 196.2-10.3M182.6-38.7Q181.7-38.7 180.7-36.3Q179.7-33.9 178.8-29.9Q177.8-25.9 177.2-21.2Q180.1-24.5 182-28.5Q183.8-32.4 183.8-35.6Q183.8-37.1 183.5-37.9Q183.2-38.7 182.6-38.7M205.4-10.8Q204.5-10.8 203.9-11.2Q203.3-11.6 203.3-12.5L203.3-12.8Q204.1-18 205.4-24.6Q206.8-31.1 207.9-35.9Q208.7-38.9 211.9-38.9Q214.9-38.9 214.9-37Q214.9-36.6 214.7-36.1Q213.5-31.2 211.6-24.3Q209.6-17.3 207.8-12.2Q207.3-10.8 205.4-10.8M203.6 0.2Q201.6 0.2 200.6-0.9Q199.5-2 199.5-3.8Q199.5-5.8 200.7-7.1Q201.9-8.3 204-8.3Q206-8.3 207.1-7.3Q208.1-6.3 208.1-4.4Q208.1-2.3 206.9-1Q205.7 0.2 203.6 0.2';

// Layout constants derived from the bounding box
const PATH_WIDTH = 212.43;
const PATH_X1 = 2.44;
const PATH_Y1 = -43.24;
const PATH_Y2 = 20.93;
const SVG_PAD = 8;
const SVG_HEIGHT = Math.ceil(PATH_Y2 - PATH_Y1 + SVG_PAD * 2); // 80
const BASELINE_Y = Math.abs(PATH_Y1) + SVG_PAD; // 51.24

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // Left edge where the text begins on screen
  const textLeft = (screenWidth - PATH_WIDTH) / 2;

  const heyClipWidth = useSharedValue(0);
  const subWidth = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  const [labelWidth, setLabelWidth] = useState(0);
  const mountTimeRef = useRef(Date.now());

  const heyClipStyle = useAnimatedStyle(() => ({
    width: heyClipWidth.value,
  }));

  const subClipStyle = useAnimatedStyle(() => ({
    width: subWidth.value,
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  useEffect(() => {
    heyClipWidth.value = withTiming(PATH_WIDTH, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });
    screenOpacity.value = withDelay(
      2700,
      withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) }, (finished) => {
        'worklet';
        if (finished) runOnJS(onComplete)();
      })
    );
  }, []);

  useEffect(() => {
    if (labelWidth <= 0) return;
    const elapsed = Date.now() - mountTimeRef.current;
    const remaining = Math.max(0, 1800 - elapsed);
    subWidth.value = withDelay(
      remaining,
      withTiming(labelWidth, { duration: 600, easing: Easing.out(Easing.quad) })
    );
  }, [labelWidth]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: colors.background }, screenStyle]}
    >
      {/* "hey, coach!" — overflow clip grows left→right, revealing filled Pacifico path */}
      <View style={{ width: screenWidth, height: SVG_HEIGHT }}>
        <Animated.View
          style={[
            styles.heyClip,
            { left: textLeft, top: 0 },
            heyClipStyle,
          ]}
        >
          <Svg height={SVG_HEIGHT} width={PATH_WIDTH}>
            <G transform={`translate(${(-PATH_X1).toFixed(2)}, ${BASELINE_Y.toFixed(2)})`}>
              <Path d={HEY_COACH_PATH} fill={colors.accent} />
            </G>
          </Svg>
        </Animated.View>
      </View>

      {/* "cue with confidence" — same clip technique */}
      <View style={styles.subtitleWrap}>
        <Text
          onLayout={(e) => setLabelWidth(e.nativeEvent.layout.width)}
          style={[styles.subtitle, styles.invisible]}
        >
          cue with confidence
        </Text>
        <Animated.View style={[styles.clipReveal, subClipStyle]}>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]} numberOfLines={1}>
            cue with confidence
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heyClip: {
    position: 'absolute',
    overflow: 'hidden',
  },
  subtitleWrap: {
    marginTop: 14,
  },
  invisible: {
    opacity: 0,
    color: 'transparent',
  },
  clipReveal: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  subtitle: {
    fontSize: 13,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
