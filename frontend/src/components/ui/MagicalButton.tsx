import React from 'react';

export interface MagicalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'magical';
}

const MagicalButton: React.FC<MagicalButtonProps> = ({ children, className, variant = 'primary', style, ...rest }) => {
  const baseClasses = "relative px-6 py-3 font-semibold text-base cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95";
  
  const variantClasses = {
    primary: "bg-gradient-to-b from-amber-200 to-amber-400 border-2 border-amber-600 text-amber-900 shadow-lg hover:from-amber-300 hover:to-amber-500 hover:shadow-xl",
    secondary: "bg-gradient-to-b from-stone-200 to-stone-300 border-2 border-stone-600 text-stone-800 shadow-lg hover:from-stone-300 hover:to-stone-400 hover:shadow-xl",
    magical: "bg-gradient-to-b from-purple-300 to-purple-500 border-2 border-purple-700 text-white shadow-lg hover:from-purple-400 hover:to-purple-600 hover:shadow-xl hover:shadow-purple-300/50"
  };

  return (
    <button
      {...rest}
      className={`${baseClasses} ${variantClasses[variant]} rounded-lg ${className || ''}`}
      style={{
        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
        ...style,
      }}
    >
      <span className="relative z-10">{children}</span>
      
      {/* Effet de lueur magique subtile */}
      {variant === 'magical' && (
        <div className="absolute inset-0 rounded-lg opacity-30 animate-pulse bg-gradient-to-r from-transparent via-white to-transparent" />
      )}
      
      {/* Bordure dorée subtile */}
      {variant === 'primary' && (
        <div className="absolute inset-0 rounded-lg border border-yellow-400/50 pointer-events-none" />
      )}
    </button>
  );
};

export default MagicalButton;