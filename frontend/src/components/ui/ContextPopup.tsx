import React, { useEffect, useRef } from 'react';
import ThickBorderCard from './ThickBorderCard';

interface ContextPopupProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
}

const ContextPopup: React.FC<ContextPopupProps> = ({ isOpen, onClose, text }) => {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const titleId = 'context-popup-title';

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // focus the close button for keyboard users
    closeBtnRef.current?.focus();

    // prevent background scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Split text into paragraphs on double line breaks, preserve single line breaks as <br />
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.split('\n').map((line, idx) => ({ line, idx })));

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-12 bg-black bg-opacity-50 z-100 p-4"
      aria-hidden={!isOpen}
    >
      {/* Increased top padding inside the card so the title isn't stuck to the top */}
      <ThickBorderCard className="w-full max-w-2xl bg-white pt-10 sm:pt-12 px-6 pb-6 relative max-h-[90vh] overflow-y-auto transform transition-all duration-200 ease-out scale-100 mt-6">
        <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative">
          {/* Added mt-6 to push the title down from the top of the popup */}
          <h2 id={titleId} className="text-xl font-semibold mb-3 mt-8">
            Contexte du jeu
          </h2>

          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Fermer le popup de contexte"
            className="absolute top-8 right-4 w-9 h-9 flex items-center justify-center border-2 border-black rounded-md bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span className="text-lg leading-none">×</span>
          </button>

          <div className="mt-2 text-sm text-gray-800 space-y-4 leading-relaxed">
            {paragraphs.map((para, pi) => (
              <p key={pi} className="whitespace-pre-wrap">
                {para.map(({ line, idx }) => (
                  <React.Fragment key={idx}>
                    {line}
                    {idx < para.length - 1 ? <br /> : null}
                  </React.Fragment>
                ))}
              </p>
            ))}
          </div>

          {/* small footer to hint how to close */}
          <div className="mt-6 text-xs text-gray-500">
            Appuyez sur Échap pour fermer.
          </div>
        </div>
      </ThickBorderCard>

      {/* close when clicking overlay */}
      <button
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-transparent"
        tabIndex={-1}
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
};

export default ContextPopup;