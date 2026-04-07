import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { createMockBase44Client } from './mockBase44Client';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const useMock =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  !appId ||
  !appBaseUrl ||
  appBaseUrl === 'your_backend_url';

// Create a client (Base44 in prod, mock locally if configured/missing env)
export const base44 = useMock
  ? createMockBase44Client()
  : createClient({
      appId,
      token,
      functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl
    });

export const isMockBase44 = !!base44.__isMock;
