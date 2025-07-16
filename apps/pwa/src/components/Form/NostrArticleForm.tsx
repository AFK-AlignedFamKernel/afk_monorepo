import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import styles from '../../styles/components/_nostr-form.module.scss';
import { useAuth, useSendArticle } from "afk_nostr_sdk"
import { useFileUpload } from '@/hooks/useFileUpload';
import { useUIStore } from '@/store/uiStore';
import { useQueryClient } from '@tanstack/react-query';
import Quill, { Delta } from 'quill';
import { Editor } from './Editor';
import { ButtonPrimary } from '../button/Buttons';
import { logClickedEvent } from '@/lib/analytics';
// import { useRouter } from 'next/router';

export type NostrEventType = 'note' | 'article';

interface NostrFormProps {
  onSubmit?: (data: NostrFormData) => Promise<void>;
  type?: NostrEventType;
  className?: string;
  initialData?: Partial<NostrFormData>;
}

export interface NostrFormData {
  content?: string;
  title?: string;
  tags?: string[];
  type?: NostrEventType;
}

export const NostrArticleForm: React.FC<NostrFormProps> = ({
  onSubmit,
  type = 'note',
  className,
  initialData,
}) => {

  const Delta = Quill.import('delta');

  // Use a ref to access the quill instance directly
  const quillRef = useRef<Quill>(null);
  
  const [formData, setFormData] = useState<NostrFormData>({
    content: initialData?.content || '',
    title: initialData?.title || '',
    tags: initialData?.tags || [],
    type: type,
  });
  const fileUpload = useFileUpload();
  const { publicKey } = useAuth()
  const sendArticle = useSendArticle();
  const { showToast } = useUIStore();
  const [note, setNote] = useState<string | undefined>();
  const [noteDelta, setNoteDelta] = useState<Delta | undefined>(new Delta());
  const [title, setTitle] = useState<string | undefined>();
  const [summary, setSummary] = useState<string | undefined>();
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof NostrFormData, string>>>({});
  const [image, setImage] = useState<File | undefined>();
  const [video, setVideo] = useState<File | undefined>();
  const queryClient = useQueryClient();

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NostrFormData, string>> = {};

    // if (!formData?.content?.trim()) {
    //   newErrors.content = 'Content is required';
    // }

    // if (formData?.type === 'article' && !formData?.title?.trim()) {
    //   newErrors.title = 'Title is required for articles';
    // }

    // if (!note?.trim().length && !image && !video) {
    //   showToast({ type: 'error', message: 'Please add a note, image, or video' });
    //   newErrors.title = 'Title is required for articles';
    // }

    if (!formData.title || !title || title?.length === 0) {
      newErrors.title = 'Title is required for articles';
    }

    if (!note || note?.length == 0) {
      showToast({ type: 'error', message: 'Please add a note, image, or video' });
      newErrors.content = 'Content is required';

    }

    if (title && !title?.trim().length) {
      showToast({ type: 'error', message: 'Title is required for articles' });
      newErrors.title = 'Title is required for articles';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const [tags, setTags] = useState<string[][]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e?.preventDefault();
    if (validateForm()) {
      // onSubmit(formData);
      handlesendArticle()
    }
  };

  const handlesendArticle = async () => {


    logClickedEvent('try_send_article', 'nostr', 'try_send_article', 1)
    if (!publicKey) {
      return showToast({ type: "error", message: "Please connect you" })
    }
    if (!formData.title || !title || title?.length === 0) {
      showToast({ type: 'error', message: 'Please add a note, image, or video' });
      return;
    }

    if (!note || note?.length == 0) {
      showToast({ type: 'error', message: 'Please add a note, image, or video' });
      return;

    }

    if (title && !title?.trim().length) {
      return showToast({ type: 'error', message: 'Title is required for articles' });

    }

    // const isAuth = await handleCheckNostrAndSendConnectDialog();
    // if (!isAuth) return;

    let imageUrl: string | undefined;

    if (image) {
      try {
        const result = await fileUpload.mutateAsync(image);
        logClickedEvent('upload_image_to_ipfs', 'nostr', 'upload_image_to_ipfs', 1);
        // Fix: result may be {} and not have a 'data' property, so check for url in result or result.data
        let url: string | undefined = undefined;
        if (result && typeof result === 'object') {
          if ('data' in result && result.data && typeof result.data === 'object' && 'url' in result.data) {
            url = (result.data as { url?: string }).url;
          } else if ('url' in result) {
            url = (result as { url?: string }).url;
          }
        }
        if (url) {
          imageUrl = url;
          logClickedEvent('upload_image_to_ipfs_success', 'nostr', 'upload_image_to_ipfs_success', 1);
        }
      }
      catch (error) {
        console.log('image upload error', error);
        logClickedEvent('upload_image_to_ipfs_error', 'nostr', 'upload_image_to_ipfs_error', 1);
      }
    }
    try {

      console.log("note", note)
      console.log("noteDelta", noteDelta)

      // Convert Quill delta to markdown string
      // const converter = new Markdow(noteDelta?.ops || [], {});
      // const html = converter.convert();
      // const turndownService = new TurndownService();
      const markdown = quillRef?.current?.getText();

      sendArticle.mutate(
        {
          content: markdown || '',
          tags: [
            ...(image && imageUrl ? [['image', imageUrl]] : []),
            // ...(tags?.map((tag) => ['tag', tag]) || []),
            ['title', title ?? ''],
            ['summary', summary ?? ''],
            ['published_at', Math.floor(Date.now() / 1000).toString()],
          ],
        },
        {
          onSuccess() {
            showToast({ type: 'success', message: 'Note sent successfully' });
            queryClient.invalidateQueries({ queryKey: ['rootNotes'] });
            logClickedEvent('send_article_success', 'nostr', 'send_article_success', 1)
          },
          onError(e) {
            console.log('error', e);
            showToast({
              type: 'error',
              message: 'Error! Note could not be sent. Please try again later.',
            });
            logClickedEvent('send_article_error_hook', 'nostr', 'send_article_error', 1)
          },
        },
      );
    } catch (error) {
      console.log('sendArticle error', error);
      logClickedEvent('send_article_error', 'nostr', 'send_article_error', 1)
    }

  };

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!formData?.tags?.includes(newTag)) {
        setFormData({
          ...formData,
          tags: [...formData?.tags || [], newTag],
        });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData?.tags?.filter((tag) => tag !== tagToRemove),
    });
  };


  return (
    <form
      className={classNames(styles['nostr-form'], className)}
      onSubmit={handleSubmit}
      data-theme="light"
    >
      <div className={styles['nostr-form__field']}>
        <label htmlFor="title" className={styles['nostr-form__label']}>
          Title
        </label>
        <input
          type="text"
          id="title"
          className={classNames(styles['nostr-form__input'], {
            [styles['nostr-form__input--error']]: errors.title,
          })}
          value={formData.title}
          onChange={(e) => {
            setFormData({ ...formData, title: e.target.value })
            setTitle(e.target.value)
          }}
          placeholder="Enter title"
        />
        {errors.title && (
          <span className={styles['nostr-form__error']}>{errors.title}</span>
        )}
      </div>


      <div className={styles['nostr-form__field']}>
        <label htmlFor="content" className={styles['nostr-form__label']}>
          Content
        </label>
        <Editor
          ref={quillRef}
          // readOnly={readOnly}
          defaultValue={new Delta()
            // .insert('GM')
            // .insert('\n', { header: 1 })
            // .insert('Some ')
            // .insert('initial', { bold: true })
            // .insert(' ')
            // .insert('content', { underline: true })
            // .insert('\n')
          }
          // onSelectionChange={setRange}
          onTextChange={() => {
            setFormData({ ...formData, content: quillRef.current?.getText() })
            setNote(quillRef.current?.getText())
            setNoteDelta(quillRef.current?.getContents())
          }}
        />
        {/* <textarea
          id="content"
          className={classNames(styles['nostr-form__textarea'], {
            [styles['nostr-form__textarea--error']]: errors.content,
          })}
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          placeholder="What's on your mind?"
          rows={formData.type === 'article' ? 10 : 4}
        /> */}
        {errors.content && (
          <span className={styles['nostr-form__error']}>{errors.content}</span>
        )}
      </div>

      <div className={styles['nostr-form__field']}>
        <label htmlFor="tags" className={styles['nostr-form__label']}>
          Tags
        </label>
        <div className={styles['nostr-form__tags']}>
          {formData?.tags?.map((tag) => (
            <span key={tag} className={styles['nostr-form__tag']}>
              #{tag}
              <button
                type="button"
                className={styles['nostr-form__tag-remove']}
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            id="tags"
            className={styles['nostr-form__tag-input']}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagAdd}
            placeholder="Add tags (press Enter)"
          />
        </div>
      </div>

      <div className={styles['nostr-form__actions']}>
        <ButtonPrimary type="submit" className={styles['nostr-form__submit']}>
          {formData.type === 'article' ? 'Publish Article' : 'Post Note'}
        </ButtonPrimary>
      </div>
    </form>
  );
}; 