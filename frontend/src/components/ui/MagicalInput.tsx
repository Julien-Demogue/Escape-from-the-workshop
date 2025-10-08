import React from 'react';

export interface MagicalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const MagicalInput: React.FC<MagicalInputProps> = ({ className, label, ...rest }) => {
  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-amber-800 mb-2 font-serif">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...rest}
          className={`w-full px-4 py-3 border-2 border-amber-600 rounded-lg bg-gradient-to-b from-amber-50 to-amber-100 text-amber-900 placeholder-amber-600/70 focus:outline-none focus:border-amber-700 focus:shadow-lg focus:shadow-amber-300/30 transition-all duration-300 font-serif ${className || ''}`}
          style={{
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
          }}
        />
        
        {/* Bordure dorée subtile */}
        <div className="absolute inset-0 rounded-lg border border-yellow-400/30 pointer-events-none" />
      </div>
    </div>
  );
};

export default MagicalInput;