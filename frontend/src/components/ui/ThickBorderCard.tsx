import React from 'react';

interface ThickBorderCardProps {
  children: React.ReactNode;
  className?: string;
}

const ThickBorderCard: React.FC<ThickBorderCardProps> = ({ children, className = '' }) => {
  return (
    <div
      style={{
        background: 'white',
        border: '3px solid black',
        borderRadius: '18px',
        padding: '24px',
        minWidth: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        fontWeight: 'bold',
      }}
      className={className}
    >
      {children}
    </div>
  );
};

export default ThickBorderCard;