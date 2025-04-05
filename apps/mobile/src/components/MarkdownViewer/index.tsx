import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View, Text } from 'react-native';
import { useStyles, useTheme } from '../../hooks';
import { ThemedStyleSheet } from 'src/styles';
import MarkdownIt from 'markdown-it';
import { MarkdownIt as MarkdownItNative } from "react-native-markdown-display";
// import style manually
import 'react-markdown-editor-lite/lib/index.css';
// import { MarkdownIt } from 'react-native-markdown-display';
// import stylesheet from './styles';

interface MarkdownViewerProps {
  content: string;
  isExpanded: boolean;
  toggleExpandedContent: () => void;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, isExpanded, toggleExpandedContent }) => {
  const { theme } = useTheme();

  // const {styles} = useStyles(stylesheet);

  const isWeb = Platform.OS === 'web';

  const isHtmlContent = content.includes('<html');

  const [isExpandedContent, setIsExpandedContent] = useState(isExpanded);

  // const markdown=  MarkdownIt({
  //   html: false,
  // });

  const markdown = MarkdownItNative({
    // html: false,
    html: true,
    linkify: true,
    typographer: true,
    markdown: true,
  });
  const truncatedContent = !isExpanded && content.length > 200 ? `${content.slice(0, 200)}...` : content;

  const markdownContent = MarkdownIt({
    // html: false,
    html: true,
    linkify: true,
    typographer: true
  }).render(truncatedContent);


  const markdownContent2 = MarkdownIt().render(content).replace(/<[^>]*>?/g, '');

  console.log("content article: ", content)
  console.log("markdownContent: ", markdownContent)
  console.log("markdown.render(content)}", markdown.render(content))
  if (isWeb) {
    return (
      <>
        {/* <Text>{markdown.render(content)}</Text> */}
        {/* <Text>{content}</Text> */}
        {/* <Text>{markdownContent2}</Text> */}
        <div
          style={{
            // backgroundColor: theme.colors.background,
            // color: theme.colors.text,
            padding: 16,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: 16,
            lineHeight: 1.6,
          }}
          dangerouslySetInnerHTML={{ __html: markdown.render(truncatedContent) }}
        />
      </>

    );
  }



  // if (!isExpanded) {
  //   return (
  //     <>
  //       <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
  //         <Text>{markdownContent}</Text>
  //         {/* <Text>{markdownContent}</Text> */}

  //         {/* <div
  //           style={{
  //             backgroundColor: theme.colors.background,
  //             color: theme.colors.text,
  //             padding: 16,
  //             fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  //             fontSize: 16,
  //             lineHeight: 1.6,
  //           }}
  //           dangerouslySetInnerHTML={{ __html: truncatedContent }}
  //         /> */}
  //       </View>

  //       {content.length > 200 && (
  //         <Pressable onPress={toggleExpandedContent}>
  //           <Text
  //           // style={styles.seeMore}
  //           >{isExpanded ? 'See less' : 'See more...'}</Text>
  //         </Pressable>
  //       )}
  //     </>

  //   );
  // }
  // Mobile implementation using WebView
  return (
    <>

      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* <Text>{markdownContent}</Text> */}

        <div
          style={{
            // backgroundColor: theme.colors.background,
            // color: theme.colors.text,
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