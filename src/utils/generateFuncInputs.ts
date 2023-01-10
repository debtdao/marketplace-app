import { Interface, ParamType } from '@ethersproject/abi';

// import ParamType type

function generateClaimFuncInputs(funcName: string, contractABI: string): ParamType[] {
  const iface = new Interface(contractABI!);
  let inputs: ParamType[] = [];
  console.log('Interface Log', iface.functions);
  for (const key in iface.functions) {
    if (funcName === iface.functions[key].name) {
      inputs = iface.functions[key].inputs ? iface.functions[key].inputs : [];
    }
  }
  console.log(inputs);
  return inputs;
}

export { generateClaimFuncInputs };
