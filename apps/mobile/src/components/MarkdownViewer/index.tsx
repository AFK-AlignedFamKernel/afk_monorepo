import React from 'react';
import { Platform, Pressable, StyleSheet, View, Text } from 'react-native';
import { useStyles, useTheme } from '../../hooks';
import { ThemedStyleSheet } from 'src/styles';
// import stylesheet from './styles';

interface MarkdownViewerProps {
  content: string;
  isExpanded: boolean;
  toggleExpandedContent: () => void;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, isExpanded, toggleExpandedContent }) => {
  const { theme } = useTheme();

  // const {styles} = useStyles(stylesheet);
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


  const truncatedContent = content.length > 200 ? `${content.slice(0, 200)}...` : content;

  if (!isExpanded) {
    return (
      <>
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
            dangerouslySetInnerHTML={{ __html: truncatedContent }}
          />
        </View>

        {content.length > 200 && (
          <Pressable onPress={toggleExpandedContent}>
            <Text
            // style={styles.seeMore}
            >{isExpanded ? 'See less' : 'See more...'}</Text>
          </Pressable>
        )}
      </>

    );
  }
  // Mobile implementation using WebView
  return (
    <>

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
      {content.length > 200 && (
        <Pressable onPress={toggleExpandedContent}>
          <Text
          // style={styles.seeMore}
          >{isExpanded ? 'See less' : 'See more...'}</Text>
        </Pressable>
      )}
    </>

  );
};

const styles = ThemedStyleSheet((theme) => ({
  container: {
    flex: 1,
  },
  seeMore: {
      color: theme.colors.text,
    fontSize: 16,
    lineHeight: 1.6,
  },
}));

export default MarkdownViewer; 