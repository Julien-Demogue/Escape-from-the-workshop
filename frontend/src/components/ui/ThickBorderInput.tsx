import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const ThickBorderInput: React.FC<InputProps> = (props) => (
  <input
    {...props}
    style={{
      border: '3px solid black',
      borderRadius: '12px',
      padding: '8px 12px',
      outline: 'none',
      fontSize: '1rem',
      ...props.style,
    }}
  />
);

export default ThickBorderInput;
