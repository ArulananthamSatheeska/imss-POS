// components/ui/input.js
import React from "react";

export const Input = React.forwardRef(
  (
    { type = "text", name, value, onChange, onKeyDown, placeholder, className },
    ref
  ) => {
    return (
      <input
        ref={ref}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      />
    );
  }
);

export const Select = ({ name, value, onChange, children, className }) => {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {children}
    </select>
  );
};
