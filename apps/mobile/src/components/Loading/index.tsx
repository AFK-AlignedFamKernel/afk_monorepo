import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

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
