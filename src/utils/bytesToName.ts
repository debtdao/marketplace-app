import { Interface, ParamType } from '@ethersproject/abi';
import { BytesLike } from 'ethers';

// import ParamType type

function bytesToName(funcBytes: BytesLike, contractABI: string): string {
  const iface = new Interface(contractABI!);
  let name: string = '';
  for (const key in iface.functions) {
    if (funcBytes === iface.getSighash(key)) {
      name = iface.functions[key].name;
    }
  }
  return name;
}

export { bytesToName };
