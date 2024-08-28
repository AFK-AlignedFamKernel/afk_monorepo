import { useState, useEffect } from 'react';

// Todo fix the hook to work well without any others lib
// Define the useMediaQuery hook
const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);

    useEffect(() => {

        if (typeof window != "undefined") {
            const mediaQuery = window.matchMedia(query);
            const handleChange = () => {
                setMatches(mediaQuery.matches);
            };

            // Add event listener
            mediaQuery.addListener(handleChange);

            // Remove event listener on cleanup
            return () => {
                mediaQuery.removeListener(handleChange);
            };
        }

    }, [query, window]);

    return matches;
};

export default useMediaQuery;