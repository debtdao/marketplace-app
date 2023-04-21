import { SPIGOT_INTEGRATION_LIST } from '@src/core/types';
import integrationsList from '@config/constants/spigot-integrations.json';

export const useSpigotIntegration = (name: SPIGOT_INTEGRATION_LIST) => {
  return (integrationsList as any)[name] ?? (integrationsList as any).none;
};
