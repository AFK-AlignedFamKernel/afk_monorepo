"use dom";

import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

// import { ToolbarPlugin } from "@lexical/react/LexicalToolbarPlugin";
import { $getRoot, $getSelection, EditorState, $isRangeSelection, FORMAT_TEXT_COMMAND, TextFormatType } from 'lexical';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useSendNote, useSendVideoEvent } from 'afk_nostr_sdk';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState, useCallback } from 'react';
import React from 'react';
import { Image, KeyboardAvoidingView, Pressable, TextInput, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GalleryIcon, SendIconContained, VideoIcon } from '../../../assets/icons';
import { LoadingSpinner } from '../../../components/Loading';
import VideoPlayer from '../../../components/VideoPlayer';
import { useNostrAuth, useStyles, useTheme } from '../../../hooks';
import { useFileUpload } from '../../../hooks/api';
import { usePinataVideoUpload } from '../../../hooks/api/useFileUpload';
import { useToast } from '../../../hooks/modals';
import { MainStackNavigationProps } from '../../../types';
import { SelectedTab } from '../../../types/tab';
import { getImageRatio } from '../../../utils/helpers';
import stylesheet from './styles';


// Lexical React plugins are React components, which makes them
// highly composable. Furthermore, you can lazy load plugins if
// desired, so you don't pay the cost for plugins until you
// actually use them.
function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();



  useEffect(() => {
    // Focus the editor when the effect fires!
    editor.focus();
  }, [editor]);

  return null;
}


export const ToolbarPlugin: React.FC<{
  onChange: (editorState: any) => void;
}> = ({ onChange }) => {
  const [editor] = useLexicalComposerContext();
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);

  const formatText = useCallback((command: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, command);
  }, [editor]);

  return (
    <View style={styles.toolbar}>
      <Pressable
        style={styles.toolbarButton}
        onPress={() => formatText('bold')}
      >
        <Text style={styles.toolbarButtonText}>B</Text>
      </Pressable>
      <Pressable
        style={styles.toolbarButton}
        onPress={() => formatText('italic')}
      >
        <Text style={styles.toolbarButtonText}>I</Text>
      </Pressable>
      <Pressable
        style={styles.toolbarButton}
        onPress={() => formatText('underline')}
      >
        <Text style={styles.toolbarButtonText}>U</Text>
      </Pressable>
      <Pressable
        style={styles.toolbarButton}
        onPress={() => formatText('strikethrough')}
      >
        <Text style={styles.toolbarButtonText}>S</Text>
      </Pressable>
    </View>
  );
};
