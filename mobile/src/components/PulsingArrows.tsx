import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PulsingArrowsProps {
  color?: string;
  size?: number;
  count?: number;
}

/**
 * Animated chevron arrows that pulse sequentially, creating a
 * "swipe to action" visual cue on checkout buttons.
 */
export default function PulsingArrows({
  color = "#fff",
  size = 16,
  count = 3,
}: PulsingArrowsProps) {
  const anims = useRef(
    Array.from({ length: count }, () => new Animated.Value(0.25))
  ).current;

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.25,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      )
    );
    const composite = Animated.parallel(animations);
    composite.start();
    return () => composite.stop();
  }, []);

  return (
    <View style={styles.row}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{ opacity: anim, marginLeft: i === 0 ? 0 : -4 }}
        >
          <Ionicons name="chevron-forward" size={size} color={color} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
});
