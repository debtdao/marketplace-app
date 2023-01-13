export const getPageName = (path: string) => {
  const lPath = path.toLowerCase().split('/');
  console.log('LPath: ', lPath);
  if (lPath.includes('spigots')) {
    return 'spigot';
  }
  if (lPath.includes('settings') || lPath.includes('disclaimer')) {
    return lPath[1];
  }
  return lPath[2];
};
