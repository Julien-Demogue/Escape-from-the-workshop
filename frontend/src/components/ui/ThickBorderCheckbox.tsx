import React from 'react';

interface ThickBorderCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const ThickBorderCheckbox: React.FC<ThickBorderCheckboxProps> = ({ label, ...props }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        className="relative"
        style={{
          width: '24px',
          height: '24px',
        }}
      >
        <input
          type="checkbox"
          {...props}
          className="absolute opacity-0 w-full h-full cursor-pointer"
        />
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            border: '3px solid black',
            borderRadius: '6px',
            backgroundColor: 'white',
          }}
        />
        {props.checked && (
          <div
            className="absolute"
            style={{
              top: '3px',
              left: '3px',
              right: '3px',
              bottom: '3px',
              backgroundColor: 'black',
              borderRadius: '2px',
            }}
          />
        )}
      </div>
      <span className="text-lg">{label}</span>
    </label>
  );
};

export default ThickBorderCheckbox;