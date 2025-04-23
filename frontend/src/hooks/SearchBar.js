// SearchBar.jsx
const SearchBar = ({ searchQuery, handleSearch, handleKeyDown, searchInputRef }) => (
    <input
        ref={searchInputRef}
        type="text"
        className="w-full text-slate-700 px-4 py-2 border rounded-lg"
        placeholder="Search by name, code, or barcode"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={handleKeyDown}
    />
);

export default SearchBar;