import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const PIECES = Array.from({ length: 18 }, (_, index) => ({
  left: `${(index * 47 + 8) % 100}%` as `${number}%`,
  width: index % 3 === 0 ? 8 : 5,
  height: index % 3 === 0 ? 13 : 9,
  delay: (index % 7) * 100,
  duration: 2100 + (index % 4) * 250,
  rotation: 140 + (index % 5) * 115,
}));

export function OrderSuccessCelebration() {
  const colors = useColors();
  const [reduceMotion, setReduceMotion] = useState(false);
  const progress = useRef<Animated.Value[]>([]);
  if (progress.current.length === 0) {
    progress.current.push(...PIECES.map(() => new Animated.Value(0)));
  }

  useEffect(() => {
    let mounted = true;
    const play = (shouldReduce: boolean) => {
      if (!mounted) return;
      setReduceMotion(shouldReduce);
      progress.current.forEach((value) => value.stopAnimation());
      if (shouldReduce) return;

      const animations = progress.current.map((value, index) => {
        value.setValue(0);
        return Animated.timing(value, {
          toValue: 1,
          duration: PIECES[index].duration,
          delay: PIECES[index].delay,
          useNativeDriver: Platform.OS !== "web",
        });
      });
      Animated.parallel(animations).start();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(play)
      .catch(() => play(false));
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", play);
    return () => {
      mounted = false;
      subscription.remove();
      progress.current.forEach((value) => value.stopAnimation());
    };
  }, []);

  if (reduceMotion) return null;

  const confettiColors = [colors.primary, colors.success, colors.warning, colors.info, colors.accentForeground];
  return (
    <View pointerEvents="none" accessible={false} style={styles.overlay}>
      {PIECES.map((piece, index) => {
        const value = progress.current[index];
        const translateY = value.interpolate({ inputRange: [0, 1], outputRange: [-20, 710] });
        const rotate = value.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${piece.rotation}deg`] });
        const opacity = value.interpolate({
          inputRange: [0, 0.12, 0.82, 1],
          outputRange: [0, 1, 0.85, 0],
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.piece,
              {
                left: piece.left,
                width: piece.width,
                height: piece.height,
                backgroundColor: confettiColors[index % confettiColors.length],
                opacity,
                transform: [{ translateY }, { rotate }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    overflow: "hidden",
  },
  piece: {
    position: "absolute",
    top: -14,
    borderRadius: 2,
  },
});