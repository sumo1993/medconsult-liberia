'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import ReactDOM from 'react-dom';
import 'react-quill/dist/quill.snow.css';

// Polyfill for React 19 compatibility
if (typeof window !== 'undefined') {
  const ReactDOMWithFindNode = ReactDOM as any;
  if (!ReactDOMWithFindNode.findDOMNode) {
    ReactDOMWithFindNode.findDOMNode = (node: any) => {
      if (node == null) return null;
      if (node instanceof HTMLElement) return node;
      return node;
    };
  }
}

const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 rounded-md animate-pulse" />
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  if (!isMounted) {
    return <div className="h-96 bg-gray-50 rounded-md animate-pulse" />;
  }

  return (
    <div className="rich-text-editor-wrapper">
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor-wrapper .ql-container {
            min-height: 400px;
            font-size: 16px;
          }
          .rich-text-editor-wrapper .ql-editor {
            min-height: 400px;
          }
          .rich-text-editor-wrapper .ql-toolbar {
            background: #f9fafb;
            border-top-left-radius: 0.5rem;
            border-top-right-radius: 0.5rem;
          }
          .rich-text-editor-wrapper .ql-container {
            border-bottom-left-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
          }
        `
      }} />
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Write your content here...'}
        className="bg-white"
      />
    </div>
  );
}
