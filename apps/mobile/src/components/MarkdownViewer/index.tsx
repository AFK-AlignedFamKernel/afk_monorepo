import React from 'react';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../hooks';

interface MarkdownViewerProps {
  content: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const { theme } = useTheme();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 16px;
            color: ${theme.colors.text};
            background-color: ${theme.colors.background};
            line-height: 1.6;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
          }
          h1 { font-size: 2em; }
          h2 { font-size: 1.5em; }
          h3 { font-size: 1.25em; }
          h4 { font-size: 1em; }
          h5 { font-size: 0.875em; }
          h6 { font-size: 0.85em; }
          p {
            margin-top: 0;
            margin-bottom: 16px;
          }
          a {
            color: ${theme.colors.primary};
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          code {
            background-color: ${theme.colors.surface};
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 85%;
          }
          pre {
            background-color: ${theme.colors.surface};
            padding: 16px;
            border-radius: 6px;
            overflow: auto;
          }
          blockquote {
            margin: 0;
            padding: 0 1em;
            color: ${theme.colors.textSecondary};
            border-left: 0.25em solid ${theme.colors.divider};
          }
          ul, ol {
            padding-left: 2em;
            margin-top: 0;
            margin-bottom: 16px;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          table {
            border-spacing: 0;
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 16px;
          }
          th, td {
            padding: 6px 13px;
            border: 1px solid ${theme.colors.divider};
          }
          th {
            background-color: ${theme.colors.surface};
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;

  return (
    <WebView
      source={{ html: htmlContent }}
      style={{ flex: 1 }}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    />
  );
};

export default MarkdownViewer; 