import { X } from "lucide-react";

export default function Modal({ children, onClose }) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
                <button className="absolute top-2 right-2" onClick={onClose}>
                    <X className="w-5 h-5" />
                </button>
                {children}
            </div>
        </div>
    );
}
