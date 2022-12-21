export function getENS(address: string, ENSRegistry: { [address: string]: string }): string | null {
  const result = ENSRegistry[address] ? ENSRegistry[address] : address;
  return result;
}
