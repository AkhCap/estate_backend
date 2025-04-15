import { useState } from 'react';
import { FaShare, FaCopy, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import { Button } from './Button';

interface ShareButtonProps {
  title: string;
  url: string;
}

export const ShareButton = ({ title, url }: ShareButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: 'Telegram',
      icon: <FaTelegramPlane className="w-5 h-5" />,
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'bg-[#229ED9] hover:bg-[#1E8BC3]'
    },
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp className="w-5 h-5" />,
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'bg-[#25D366] hover:bg-[#20BD5C]'
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Ошибка при копировании ссылки:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <FaShare className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-lg p-4 z-20">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Поделиться через:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {shareLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 p-2 rounded-xl text-white transition-colors ${link.color}`}
                    >
                      {link.icon}
                      <span className="text-sm">{link.name}</span>
                    </a>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Или скопировать ссылку:
                </p>
                <input
                  type="text"
                  value={url}
                  readOnly
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50"
                />
                <button
                  onClick={copyToClipboard}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl transition-colors ${
                    copied 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FaCopy className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {copied ? 'Скопировано!' : 'Копировать'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 