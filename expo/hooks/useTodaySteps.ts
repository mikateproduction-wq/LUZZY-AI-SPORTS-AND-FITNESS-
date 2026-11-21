import { useEffect, useSyncExternalStore } from 'react';

import {
  getStepsSnapshot,
  getTodaySteps,
  releaseSteps,
  retainSteps,
  subscribeSteps,
  type StepsStatus,
} from '@/lib/stepService';

export interface TodaySteps {
  steps: number;
  status: StepsStatus;
}

/**
 * Pas du jour, mis à jour en direct. Tous les écrans partagent le même abonnement :
 * le capteur ne tourne qu'une fois, et s'arrête quand l'écran est démonté.
 */
export function useTodaySteps(): TodaySteps {
  useEffect(() => {
    retainSteps();
    return () => {
      releaseSteps();
    };
  }, []);

  const snapshot = useSyncExternalStore(subscribeSteps, getStepsSnapshot, getStepsSnapshot);

  return {
    steps: getTodaySteps(snapshot),
    status: snapshot.status,
  };
}
