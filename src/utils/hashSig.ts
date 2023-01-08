import { Interface } from '@ethersproject/abi';

function generateSig(funcName: string, contractABI: string) {
  const iface = new Interface(contractABI!);
  let funcSig = '';
  console.log('Interface Log', iface.functions);
  for (const key in iface.functions) {
    if (funcName === iface.functions[key].name) {
      funcSig = key;
    }
  }
  console.log(iface.getSighash(funcSig));
  return iface.getSighash(funcSig);
}

export { generateSig };
