// useSearch.js
import { useState, useEffect } from "react";
import debounce from "lodash.debounce";

const useSearch = (items) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);

    const debouncedSearch = debounce((query) => {
        const results = items.filter(
            (item) =>
                item.name.toLowerCase().includes(query.toLowerCase()) ||
                item.code.includes(query) ||
                item.barcode.includes(query)
        );
        setSearchResults(results);
        setSelectedSearchIndex(0);
    }, 300);

    useEffect(() => {
        if (searchQuery) {
            debouncedSearch(searchQuery);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
        selectedSearchIndex,
        setSelectedSearchIndex,
    };
};

export default useSearch;