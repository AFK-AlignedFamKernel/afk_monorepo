"use dom";

import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useStyles, useTheme } from '../../../hooks';
import stylesheet from './styles';
import * as ImagePicker from 'expo-image-picker';

interface QuillEditorFormProps {
  onChange: (content: string) => void;
  onImageUpload: (image: ImagePicker.ImagePickerAsset) => Promise<string | undefined>;
}

const QuillEditorForm = ({ onChange, onImageUpload }: QuillEditorFormProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
          ],
          clipboard: {
            matchVisual: false,
          }
        },
        placeholder: 'Write your content here...',
      });

      // Handle text change
      quillRef.current.on('text-change', () => {
        const content = quillRef.current?.root.innerHTML;

        onChange(content);
        console.log('Editor content:', content);
      });
    }

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []);

  return (
    <div className="quill-editor" style={styles.editorContainer}>
      <div ref={editorRef} style={styles.editor} />
    </div>
  );
};

export default QuillEditorForm;