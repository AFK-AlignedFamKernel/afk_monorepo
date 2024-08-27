import { useMemo } from "react";
import { useWindowDimensions } from "./useWindowDimensions";


export const useIsDesktop = () => {

    const dimensions = useWindowDimensions();
    const isDesktop = useMemo(() => {
        return dimensions.width >= 1024;
    }, [dimensions]); // Adjust based on your breakpoint for desktop

    return isDesktop

}
