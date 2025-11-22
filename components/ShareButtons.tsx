'use client';

import { Facebook, Link as LinkIcon, Share2, MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
}

export default function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform: string) => {
    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400');
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 flex items-center">
        <Share2 size={16} className="mr-2" />
        Share:
      </span>
      
      <button
        onClick={() => handleShare('facebook')}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        title="Share on Facebook"
        aria-label="Share on Facebook"
      >
        <Facebook size={20} />
      </button>

      <button
        onClick={() => handleShare('whatsapp')}
        className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
        title="Share on WhatsApp"
        aria-label="Share on WhatsApp"
      >
        <MessageCircle size={20} />
      </button>

      <button
        onClick={handleCopyLink}
        className={`p-2 rounded-md transition-colors ${
          copied
            ? 'text-emerald-600 bg-emerald-50'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        title={copied ? 'Link copied!' : 'Copy link'}
        aria-label="Copy link"
      >
        <LinkIcon size={20} />
      </button>

      {copied && (
        <span className="text-sm text-emerald-600 font-medium">Copied!</span>
      )}
    </div>
  );
}
