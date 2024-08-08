import { useStore } from 'zustand';
/* This code defines a function called `createBoundedUseStore` that takes a `store` object of type
`StoreApi<unknown>` as its argument. The function returns a function that can be used to access the
state of the `store` object from inside a React component. */
const createBoundedUseStore = ((store) => (selector, equals) => useStore(store, selector, equals));
export default createBoundedUseStore;
