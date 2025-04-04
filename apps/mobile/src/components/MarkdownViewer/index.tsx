import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks';

interface MarkdownViewerProps {
  content: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const { theme } = useTheme();

  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          padding: 16,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontSize: 16,
          lineHeight: 1.6,
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Mobile implementation using WebView
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <div
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          padding: 16,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontSize: 16,
          lineHeight: 1.6,
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MarkdownViewer; 