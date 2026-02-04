import { createConfig } from '@lifi/sdk';

export const initLiFi = () => {
    createConfig({
        integrator: 'payrolled-hackathon',
        providers: [], // We rely on public endpoints for this demo
    });
};
