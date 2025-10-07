import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const ThickBorderButton: React.FC<ButtonProps> = ({ children, style, ...rest }) => (
  <button
    {...rest}
    style={{
      border: '3px solid black',
      borderRadius: '12px',
      padding: '10px 20px',
      background: 'white',
      fontWeight: 600,
      fontSize: '1rem',
      cursor: 'pointer',
      ...style,
    }}
  >
    {children}
  </button>
);

export default ThickBorderButton;
