import React from 'react';
import { useTheme } from '../../hooks';
import { Platform, StyleSheet, View } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import WebView from 'react-native-webview';

interface MarkdownViewerProps {
  content: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const { theme } = useTheme();

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Markdown
          markdownit={MarkdownIt({ typographer: true }).disable(['link', 'image'])}
          style={{
            body: {
              color: theme.colors.text,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontSize: 16,
              lineHeight: 1.6,
            },
            heading1: {
              fontSize: 32,
              fontWeight: '600',
              marginTop: 24,
              marginBottom: 16,
              color: theme.colors.text,
            },
            heading2: {
              fontSize: 24,
              fontWeight: '600',
              marginTop: 24,
              marginBottom: 16,
              color: theme.colors.text,
            },
            heading3: {
              fontSize: 20,
              fontWeight: '600',
              marginTop: 24,
              marginBottom: 16,
              color: theme.colors.text,
            },
            paragraph: {
              marginTop: 0,
              marginBottom: 16,
            },
            link: {
              color: theme.colors.primary,
            },
            code_inline: {
              backgroundColor: theme.colors.surface,
              padding: '0.2em 0.4em',
              borderRadius: 3,
              fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
              fontSize: '85%',
            },
            code_block: {
              backgroundColor: theme.colors.surface,
              padding: 16,
              borderRadius: 6,
              overflow: 'auto',
            },
            blockquote: {
              margin: 0,
              padding: '0 1em',
              color: theme.colors.textSecondary,
              borderLeft: `0.25em solid ${theme.colors.divider}`,
            },
            list_item: {
              marginBottom: 8,
            },
            bullet_list: {
              marginTop: 0,
              marginBottom: 16,
              paddingLeft: 32,
            },
            ordered_list: {
              marginTop: 0,
              marginBottom: 16,
              paddingLeft: 32,
            },
            table: {
              borderSpacing: 0,
              borderCollapse: 'collapse',
              width: '100%',
              marginBottom: 16,
            },
            th: {
              padding: '6px 13px',
              border: `1px solid ${theme.colors.divider}`,
              backgroundColor: theme.colors.surface,
            },
            td: {
              padding: '6px 13px',
              border: `1px solid ${theme.colors.divider}`,
            },
          }}
        >
          {content}
        </Markdown>
      </View>
    );
  }
  // Mobile implementation using WebView
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <WebView
        source={{ html: content }}
      />
      <Markdown
        markdownit={MarkdownIt({ typographer: true }).disable(['link', 'image'])}
        style={{
          body: {
            color: theme.colors.text,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: 16,
            lineHeight: 1.6,
          },
          heading1: {
            fontSize: 32,
            fontWeight: '600',
            marginTop: 24,
            marginBottom: 16,
            color: theme.colors.text,
          },
          heading2: {
            fontSize: 24,
            fontWeight: '600',
            marginTop: 24,
            marginBottom: 16,
            color: theme.colors.text,
          },
          heading3: {
            fontSize: 20,
            fontWeight: '600',
            marginTop: 24,
            marginBottom: 16,
            color: theme.colors.text,
          },
          paragraph: {
            marginTop: 0,
            marginBottom: 16,
          },
          link: {
            color: theme.colors.primary,
          },
          code_inline: {
            backgroundColor: theme.colors.surface,
            padding: '0.2em 0.4em',
            borderRadius: 3,
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '85%',
          },
          code_block: {
            backgroundColor: theme.colors.surface,
            padding: 16,
            borderRadius: 6,
            overflow: 'auto',
          },
          blockquote: {
            margin: 0,
            padding: '0 1em',
            color: theme.colors.textSecondary,
            borderLeft: `0.25em solid ${theme.colors.divider}`,
          },
          list_item: {
            marginBottom: 8,
          },
          bullet_list: {
            marginTop: 0,
            marginBottom: 16,
            paddingLeft: 32,
          },
          ordered_list: {
            marginTop: 0,
            marginBottom: 16,
            paddingLeft: 32,
          },
          table: {
            borderSpacing: 0,
            borderCollapse: 'collapse',
            width: '100%',
            marginBottom: 16,
          },
          th: {
            padding: '6px 13px',
            border: `1px solid ${theme.colors.divider}`,
            backgroundColor: theme.colors.surface,
          },
          td: {
            padding: '6px 13px',
            border: `1px solid ${theme.colors.divider}`,
          },
        }}
      >
        {content}
      </Markdown>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default MarkdownViewer; 