import { Interface, ParamType } from '@ethersproject/abi';
import { ethers, utils } from 'ethers';

import { SecuredLineABI, LineFactoryABI, CreditLibABI, LineLibABI } from '../core/services/contracts';

function decodeErrorData(data: utils.BytesLike): string {
  // const decodedData = ethers.utils.defaultAbiCoder.decode({abi: SecuredLineABI}, data);
  // console.log(decodedData);
  console.log('Made it to the Error Func');
  const lineIface = new Interface(SecuredLineABI!);
  const factoryIface = new Interface(LineFactoryABI);
  const creditLibIface = new Interface(CreditLibABI);
  const lineLibIface = new Interface(LineLibABI);
  // const selector = data.slice(0, 10);
  console.log('Error isBytesLike: ', ethers.utils.isBytesLike(data));

  // console.log(selector);
  console.log('Error func iface', lineIface);

  console.log('Error data: ', data);
  //   const errorFrag = ethers.utils.ErrorFragment.from(data);
  debugger;
  try {
    const errData = lineLibIface.parseError(data);
    console.log(errData);
  } catch (err) {
    console.log(err);
  }

  //   console.log('Error Func data', stuff);

  return '';
}

export { decodeErrorData };
