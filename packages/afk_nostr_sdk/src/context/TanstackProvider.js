import { jsx as _jsx } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 2 } },
});
export const TanstackProvider = ({ children }) => {
    return (_jsx(QueryClientProvider, { client: queryClient, children: children }));
};
