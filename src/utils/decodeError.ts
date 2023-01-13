import { Interface, ParamType } from '@ethersproject/abi';
import { ethers, utils } from 'ethers';

import { SecuredLineABI, LineFactoryABI, CreditLibABI, LineLibABI } from '../core/services/contracts';

function decodeErrorData(data: string): string {
  // const decodedData = ethers.utils.defaultAbiCoder.decode({abi: SecuredLineABI}, data);
  // console.log(decodedData);
  console.log('Made it to the Error Func');
  const lineIface = new Interface(SecuredLineABI!);
  const factoryIface = new Interface(LineFactoryABI);
  const creditLibIface = new Interface(CreditLibABI);
  const lineLibIface = new Interface(LineLibABI);
  const selector = data.slice(0, 10);

  // const result = lineIface.decodeFunctionResult('depositAndClose', data);
  // console.log(result);

  console.log('Error Selector ', selector);
  for (const k in lineIface.functions) {
    console.log('Function Selectors - Secured Line', lineIface.getSighash(k), k);
    if (lineIface.getSighash(k) === selector) {
      console.log('Made it here');
      console.log(lineIface.functions[k].name);
      const result = lineIface.decodeFunctionResult(lineIface.functions[k].name, data);
      console.log(result);
    }
  }

  // for (const k in factoryIface.errors) {
  //   console.log('Error Selectors - Line Factory', factoryIface.getSighash(k), k);
  // }

  // for (const k in creditLibIface.errors) {
  //   console.log('Error Selectors - CreditLib', creditLibIface.getSighash(k), k);
  // }
  // for (const k in lineIface.errors) {
  //   console.log('Error Selectors - Line Lib', lineLibIface.getSighash(k), k);
  // }

  // console.log('Error isBytesLike: ', ethers.utils.isBytesLike(data));

  //   const errorFrag = ethers.utils.ErrorFragment.from(data);
  // debugger;
  // try {
  //   const errData = lineLibIface.parseError(data);
  //   console.log(errData);
  // } catch (err) {
  //   console.log(err);
  // }

  //   console.log('Error Func data', stuff);

  return '';
}

export { decodeErrorData };
