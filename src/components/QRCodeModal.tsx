import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Share2, X, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QRCodeModalProps {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ url, title, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Location Share Node: ${title}`,
          text: `Access live encrypted tactical location stream.`,
          url: url,
        });
      } catch (e) {
        console.log('Share dismissed');
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-mono">
      <div className="relative w-full max-w-md bg-cyber-bg border border-cyber-teal/60 rounded-xl p-6 shadow-neon-teal">
        <div className="flex items-center justify-between border-b border-cyber-teal/30 pb-3 mb-4">
          <div className="flex items-center gap-2 text-cyber-teal font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-cyber-teal" />
            <span>ENCRYPTED MATRIX QR CODE</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-cyber-teal transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center bg-black/60 p-6 rounded-lg border border-cyber-border mb-4">
          <div className="p-3 bg-white rounded-lg shadow-neon-teal">
            <QRCodeSVG
              value={url}
              size={200}
              bgColor="#ffffff"
              fgColor="#050811"
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-cyber-teal/80 mt-3 text-center truncate max-w-full">
            {url}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyber-teal/10 border border-cyber-teal/40 hover:bg-cyber-teal/20 text-cyber-teal rounded-lg transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-cyber-green" /> : <Copy className="w-4 h-4" />}
            {copied ? 'LINK COPIED' : 'COPY NODE LINK'}
          </button>

          <button
            onClick={handleWebShare}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyber-green/10 border border-cyber-green/40 hover:bg-cyber-green/20 text-cyber-green rounded-lg transition-all"
          >
            <Share2 className="w-4 h-4" />
            WEB SHARE
          </button>
        </div>
      </div>
    </div>
  );
};
