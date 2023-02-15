import { Interface, ParamType } from '@ethersproject/abi';
import { BytesLike } from 'ethers';

// import ParamType type

function bytesToName(funcBytes: BytesLike, contractABI: string): string {
  const iface = new Interface(contractABI!);
  let name: string = '';
  console.log('Interface Log', iface.functions);
  console.log(funcBytes);
  for (const key in iface.functions) {
    if (funcBytes === iface.getSighash(key)) {
      name = iface.functions[key].name;
    }
  }
  //   for (const key in iface.functions) {
  //     if (funcName === iface.functions[key].name) {
  //       inputs = iface.functions[key].inputs ? iface.functions[key].inputs : [];
  //     }
  //   }
  //   console.log(inputs);
  console.log(name);
  return name;
}

export { bytesToName };
