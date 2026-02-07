// Polyfills for Web3 library compatibility
// This must be loaded BEFORE any other imports

// Ensure globalThis exists
if (typeof globalThis === 'undefined') {
    (window as any).globalThis = window;
}

// Ensure global exists (Node.js compatibility for browser)
if (typeof (window as any).global === 'undefined') {
    (window as any).global = globalThis;
}

// Ensure BigInt is accessible from globalThis
if (typeof (globalThis as any).BigInt === 'undefined' && typeof BigInt !== 'undefined') {
    (globalThis as any).BigInt = BigInt;
}

// Ensure Buffer exists (required by some crypto libraries)
if (typeof (globalThis as any).Buffer === 'undefined') {
    (globalThis as any).Buffer = {
        isBuffer: () => false,
        from: () => new Uint8Array(),
        alloc: () => new Uint8Array(),
    };
}

export { };
