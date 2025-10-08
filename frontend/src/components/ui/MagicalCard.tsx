import React from 'react';

interface MagicalCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'parchment' | 'stone' | 'magical';
}

const MagicalCard: React.FC<MagicalCardProps> = ({ children, className, variant = 'parchment' }) => {
  const variantClasses = {
    parchment: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-600 shadow-amber-200/50',
    stone: 'bg-gradient-to-br from-stone-100 to-stone-200 border-stone-600 shadow-stone-200/50', 
    magical: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-600 shadow-purple-200/50'
  };

  return (
    <div className={`relative p-6 border-2 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl ${variantClasses[variant]} ${className || ''}`}
         style={{
           clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
         }}>
      
      {/* Bordure dorée décorative */}
      <div className="absolute inset-2 border border-yellow-400/30 rounded-lg pointer-events-none" 
           style={{
             clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
           }} />
      
      {/* Coins décoratifs */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-yellow-600/40" />
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-yellow-600/40" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-yellow-600/40" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-yellow-600/40" />
      
      {/* Contenu */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default MagicalCard;