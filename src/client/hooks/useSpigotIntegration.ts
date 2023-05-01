import { SPIGOT_INTEGRATION_LIST, SpigotIntegration } from '@src/core/types';
import integrationsList from '@config/constants/spigot-integrations.js';

export const useSpigotIntegration = (name: SPIGOT_INTEGRATION_LIST = 'custom'): SpigotIntegration => {
  return (integrationsList as any)[name] ?? (integrationsList as any).none;
};
