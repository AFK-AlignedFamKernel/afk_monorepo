import React, {useEffect} from 'react';
import {ActivityIndicator, Easing, StyleSheet, View} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface LoadingAnimationProps {
  size?: number;
  color?: string;
}

const Loading = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0C0C4F" />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    marginTop: 50,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Loading;

interface ThemedLoadingSpinnerProps {
  size?: number;
  color?: string;
  borderWidth?: number;
}

export const LoadingSpinner: React.FC<ThemedLoadingSpinnerProps> = ({
  size = 22,
  color = 'white',
  borderWidth = 3,
}) => {
  const rotation = useSharedValue(0);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotateZ: `${rotation.value}deg`,
        },
      ],
    };
  }, [rotation.value]);

  const styles = StyleSheet.create({
    spinner: {
      height: size,
      width: size,
      borderRadius: size / 2,
      borderWidth,
      borderTopColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: color,
    },
  });

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      200,
    );
    return () => cancelAnimation(rotation);
  }, []);

  return <Animated.View style={[styles.spinner, animatedStyles]} />;
};
