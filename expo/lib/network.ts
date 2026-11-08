import * as Network from 'expo-network';

import { logger } from '@/utils/logger';
import { isSecureUrl } from '@/utils/validation';

export class InsecureUrlError extends Error {
  constructor() {
    super('URL non sécurisée refusée (HTTPS requis)');
    this.name = 'InsecureUrlError';
  }
}

export class OfflineError extends Error {
  constructor() {
    super('Pas de connexion internet');
    this.name = 'OfflineError';
  }
}

export async function hasInternetAccess(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (!state.isConnected) return false;
    return state.isInternetReachable !== false;
  } catch (error) {
    logger.error('[Network] state check failed', error);
    return false;
  }
}

export async function secureFetch(url: string, init?: RequestInit): Promise<Response> {
  if (!isSecureUrl(url)) {
    logger.error('[Network] insecure URL refused');
    throw new InsecureUrlError();
  }
  if (!(await hasInternetAccess())) {
    throw new OfflineError();
  }
  return fetch(url, init);
}
