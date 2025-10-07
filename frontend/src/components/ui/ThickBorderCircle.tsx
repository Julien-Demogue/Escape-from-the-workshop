import React from 'react';

export interface CircleProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  children?: React.ReactNode;
}

const ThickBorderCircle: React.FC<CircleProps> = ({ size = 48, children, style, ...rest }) => (
  <div
    {...rest}
    style={{
      width: size,
      height: size,
      border: '3px solid black',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style,
    }}
  >
    {children}
  </div>
);

export default ThickBorderCircle;
