import { StyleSheet, Text, View } from 'react-native';

interface AvatarProps {
  emoji: string;
  color: string;
  size?: number;
}

export function Avatar({ emoji, color, size = 44 }: AvatarProps) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}22`, borderColor: `${color}55` },
      ]}
    >
      <Text style={{ fontSize: size * 0.5, lineHeight: size * 0.62 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
