// @/components/ui/button.js
export const Button = ({ children, onClick, className = '' }) => (
    <button
        onClick={onClick}
        className={` text-white rounded-lg px-4 py-2 ${className}`}
    >
        {children}
    </button>
);
