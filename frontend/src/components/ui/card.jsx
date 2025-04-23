// @/components/ui/card.js
export const Card = ({ children }) => (
    <div className="rounded-lg border-slate-500 border shadow-md p-4">{children}</div>
);

export const CardContent = ({ children }) => (
    <div className="p-2">{children}</div>
);
