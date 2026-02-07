import { createConfig } from '@lifi/sdk';

// Initialize LI.FI SDK with proper configuration
export const initLiFi = () => {
    createConfig({
        integrator: 'payrolled-hackathon',
        // RPC providers improve routing quality
        // For production, add your own RPC URLs here
        providers: [],
    });
};

// Helper to check if LI.FI is initialized
let isInitialized = false;
export const ensureLiFiInit = () => {
    if (!isInitialized) {
        initLiFi();
        isInitialized = true;
    }
};
