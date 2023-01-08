import React from 'react';
import { FC, useState, useEffect } from 'react';
import { ParamType } from '@ethersproject/abi';

import { useAppTranslation, useAppDispatch, useAppSelector } from '@hooks';

import { TxNumberInput } from './TxNumberInput';
import { TxByteInput } from './TxByteInput';
import { Header } from './TxFuncSelector';
import { TxAddressInput } from './TxAddressInput';

interface FunctionInputs {
  funcInputs: ParamType[];
}

export const GenerateClaimRevenueInputs: FC<FunctionInputs> = ({ funcInputs }) => {
  const { t } = useAppTranslation('common');

  const claimRevenue = () => {
    return 'placeholder';
  };

  // handleChange(name) {
  //   this.setState({name: target.value});
  // }

  if (!funcInputs || funcInputs.length === 0) {
    return <></>;
  }
  const inputFieldsHTML = [];
  // const inputFieldsHTML = funcInputs.map((input, i) => {
  for (let i = 0; i < funcInputs.length; i++) {
    const input = funcInputs[i];
    if (input.type.includes('int')) {
      // const inputName = input.name;
      // const setInputName = 'set' + input.name;
      // eval(inputName);
      // eval(setInputName);
      // const [] = useState<ParamType>({});
      // const [[input.name], ['set' + input.name]] = useState(input.type);
      inputFieldsHTML.push(<TxNumberInput headerText={input.name} amount={''} onInputChange={claimRevenue} />);
    }
    if (input.type === 'address') {
      inputFieldsHTML.push(<TxAddressInput headerText={input.name} address={''} />);
    }
    if (input.type === 'bytes') {
      inputFieldsHTML.push(<TxByteInput headerText={input.name} byteCode={''} onByteCodeChange={claimRevenue} />);
    }
  }

  const mergedInputFieldsHTML = (
    <React.Fragment>
      <Header>{t('components.transaction.claim-revenue.rev-contract-inputs')}</Header>
      {inputFieldsHTML}
    </React.Fragment>
  );
  return mergedInputFieldsHTML;
};
