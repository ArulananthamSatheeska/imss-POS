import React from "react";

const ItemCard = ({ image, name, price, stock, onSelect }) => {
    return (
        <div
            className="flex items-center p-4 bg-white rounded-2xl shadow-lg hover:shadow-xl cursor-pointer transition-shadow duration-300 max-w-md"
            onClick={onSelect}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
                if (e.key === "Enter") onSelect();
            }}
        >
            <img
                src={image}
                alt={name}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
            />
            <div className="flex flex-col flex-grow ml-4">
                <span className="text-lg font-bold text-gray-900">{name}</span>
                <span className="text-sm text-gray-600 mt-1">
                    {stock !== undefined ? `Stock: ${stock}` : ""}
                </span>
            </div>
            <div className="flex flex-col items-end ml-4">
                <span className="text-lg font-bold text-indigo-600">₹{price}</span>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect();
                    }}
                    className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    Add
                </button>
            </div>
        </div>
    );
};

export default ItemCard;
