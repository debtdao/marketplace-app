import React from 'react';
import { FC, useState, useEffect } from 'react';
import styled from 'styled-components';
import { getAddress } from '@ethersproject/address';
import { BytesLike, ethers } from 'ethers';
import { ParamType } from '@ethersproject/abi';

import { formatAmount, generateSig, isValidAddress, normalizeAmount } from '@utils';
import {
  useAppTranslation,
  useAppDispatch,

  // used to dummy token for dev
  useAppSelector,
  useSelectedSellToken,
} from '@hooks';
import { getConstants } from '@src/config/constants';
import { generateClaimFuncInputs } from '@src/utils/generateFuncInputs';
import {
  TokensActions,
  TokensSelectors,
  VaultsSelectors,
  LinesSelectors,
  ModalSelectors,
  LinesActions,
  CollateralSelectors,
  CollateralActions,
  WalletSelectors,
  OnchainMetaDataSelector,
  OnchainMetaDataActions,
} from '@store';

import { TxContainer } from './components/TxContainer';
import { TxTokenInput } from './components/TxTokenInput';
import { TxCreditLineInput } from './components/TxCreditLineInput';
import { TxActionButton, TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';
import { TxAddressInput } from './components/TxAddressInput';
import { TxByteInput } from './components/TxByteInput';
import { Header, TxFuncSelector } from './components/TxFuncSelector';
import { TxNumberInput } from './components/TxNumberInput';
import { GenerateClaimRevenueInputs } from './components/TxClaimRevenueInputs';

const {
  CONTRACT_ADDRESSES: { ETH },
} = getConstants();
const StyledTransaction = styled(TxContainer)``;

interface ClaimRevenueProps {
  header: string;
  onClose: () => void;
}

export const ClaimRevenueTx: FC<ClaimRevenueProps> = (props) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const { header, onClose } = props;
  const [targetTokenAmount, setTargetTokenAmount] = useState('10000000');
  const selectedSpigot = useAppSelector(CollateralSelectors.selectSelectedSpigot);
  const { revenueContractAddress: selectedRevenueContract } = useAppSelector(ModalSelectors.selectActiveModalProps);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const [claimData, setClaimData] = useState('');
  const contractABI = useAppSelector(OnchainMetaDataSelector.selectABI);
  const selectedContractFunctions = useAppSelector(OnchainMetaDataSelector.selectFunctions);
  const [claimFuncType, setClaimFuncType] = useState({ id: '', label: '', value: '' });
  const [claimFunc, setClaimFunc] = useState<string>('');
  // TODO: fix issue where closing the modal causes claimFunc to be undefined
  // const actualClaimFunc = selectedSpigot.spigots ? selectedSpigot.spigots[selectedRevenueContract].claimFunc : '';

  const [funcInputs, setFuncInputs] = useState<ParamType[]>([]);
  const [userFuncInputs, setUserFuncInputs] = useState<{ [name: string]: any }>({});

  const [transactionLoading, setLoading] = useState(false);
  const [revenueTokenToClaim, setRevenueTokenToClaim] = useState('');
  const [transactionCompleted, setTransactionCompleted] = useState(0);

  // Event Handlers

  useEffect(() => {
    if (selectedSpigot.spigots) {
      console.log(selectedSpigot);
      setClaimFunc(selectedSpigot.spigots[selectedRevenueContract].claimFunc);
    }
  }, []);

  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  if (!selectedSpigot) return null;

  const claimRevenue = () => {
    if (!selectedSpigot.id) {
      console.log('claim rev modal: claimRevenue() - no spigot selected');
      return;
    }

    if (!selectedRevenueContract) {
      console.log('claim rev modal: claimRevenue() - no rev contract selected');
      return;
    }

    if (!revenueTokenToClaim) {
      console.log('claim rev modal: claimRevenue() - no rev token selected');
      return;
    }

    console.log('Claim Rev Data', selectedSpigot.id, selectedRevenueContract, claimFunc, walletNetwork);

    dispatch(
      CollateralActions.claimRevenue({
        spigotAddress: selectedSpigot.id,
        revenueContract: selectedRevenueContract,
        token: revenueTokenToClaim,
        claimData: claimFunc, // default to null claimdata
        network: walletNetwork,
      })
    )
      .then((res) => {
        console.log('claim rev success', res);
      })
      .catch((err) => {
        console.log('claim rev fail', err);
      });
  };

  if (transactionCompleted === 1) {
    return (
      <StyledTransaction onClose={onClose} header={'transaction'}>
        <TxStatus
          success={transactionCompleted}
          transactionCompletedLabel={t('components.transaction.success-message')}
          exit={onTransactionCompletedDismissed}
        />
      </StyledTransaction>
    );
  }

  if (transactionCompleted === 2) {
    return (
      <StyledTransaction onClose={onClose} header={'transaction'}>
        <TxStatus
          success={transactionCompleted}
          transactionCompletedLabel={t('components.transaction.claim-revenue.error-message')}
          exit={onTransactionCompletedDismissed}
        />
      </StyledTransaction>
    );
  }

  // TODO: Autopopulate claimFunc in modal so this function can be deprecated.
  const onClaimFuncSelection = (newFunc: { id: string; label: string; value: string }) => {
    const funcInputs = generateClaimFuncInputs(newFunc.label, contractABI[selectedRevenueContract]!);
    setFuncInputs(funcInputs);
    const hashedSigFunc = generateSig(newFunc.label, contractABI[selectedRevenueContract]!);
    setClaimFunc(hashedSigFunc);
    setClaimFuncType(newFunc);

    // generateClaimFuncInputs - setSlaimFuncInputs into component state
    // add input fields to modal
  };

  const isVerifiedContract =
    isValidAddress(selectedRevenueContract) &&
    contractABI &&
    selectedContractFunctions[selectedRevenueContract] !== undefined &&
    Object.values(selectedContractFunctions[selectedRevenueContract])!.length !== 0;

  const funcOptions = !selectedContractFunctions[selectedRevenueContract]
    ? []
    : Object.values(selectedContractFunctions[selectedRevenueContract]).map((func, i) => ({
        id: i.toString(),
        label: func,
        value: '',
      }));

  const handleInputChange = (name: string, type: string, value: any) => {
    const newUserFuncInputs = { ...userFuncInputs, [name]: value };
    setUserFuncInputs(newUserFuncInputs);
  };

  const generateInputFields = () => {
    if (funcInputs.length === 0) {
      return null;
    }
    const inputFieldsHTML = funcInputs.map((input, i) => {
      if (input.type.includes('int')) {
        return (
          <TxNumberInput
            headerText={input.name}
            amount={userFuncInputs[input.name] ?? ''}
            placeholder={'0'}
            onInputChange={(e: any) => handleInputChange(input.name, input.type, e)}
          />
        );
      }
      if (input.type === 'address') {
        return (
          <TxAddressInput
            headerText={input.name}
            address={userFuncInputs[input.name] ?? ''}
            onAddressChange={(e: any) => handleInputChange(input.name, input.type, e)}
          />
        );
      }
      if (input.type === 'bytes' || input.type.includes('bytes')) {
        return (
          <TxByteInput
            headerText={input.name}
            byteCode={userFuncInputs[input.name] ?? ''}
            onByteCodeChange={(e: any) => handleInputChange(input.name, input.type, e)}
          />
        );
      }
      return null;
    });

    const mergedInputFieldsHTML = (
      <React.Fragment>
        <Header>{t('components.transaction.claim-revenue.rev-contract-inputs')}</Header>
        {inputFieldsHTML}
      </React.Fragment>
    );
    return mergedInputFieldsHTML;
  };

  // TODO: Fix logic to autopopulate claim revenue function within the modal.
  // Logic to successfully call claim revenue within the modal
  // console.log('Rev Contract Mapping funcs', selectedContractFunctions);
  // console.log('Rev Contract Mapping', selectedContractFunctions[selectedRevenueContract]);
  // const selectedFunc = {
  //   id: '0',
  //   label: 'claimPullPayment', //selectedContractFunctions[selectedRevenueContract][actualClaimFunc],
  //   value: '',
  // };
  // const funcOptions2 = [selectedFunc];

  // const funcInputs2 = generateClaimFuncInputs(selectedFunc.label, contractABI[selectedRevenueContract]!);
  // console.log('Func Inputs: ', funcInputs2);
  // setFuncInputs(funcInputs2);
  // const hashedSigFunc = generateSig(selectedFunc.label, contractABI[selectedRevenueContract]!);
  // console.log('Rev Contract Mapping - hashedSigFunc: ', hashedSigFunc);
  // setClaimFunc(hashedSigFunc);
  // setClaimFuncType(selectedFunc);

  return (
    <StyledTransaction onClose={onClose} header={header}>
      <TxAddressInput
        headerText={t('components.transaction.enable-spigot.revenue-contract')}
        inputText={t('components.transaction.claim-revenue.rev-contract-input-text')}
        address={selectedRevenueContract}
        //onAddressChange={onRevContractChange}
      />

      {/* NOTE: user must manually input the revenue token they wish to claim because there is no assumption that the revenue contract will have an oracle and be included in the Debt DAO subgraph */}
      <TxAddressInput
        headerText={t('components.transaction.enable-spigot.revenue-token-to-claim')}
        inputText={t('components.transaction.claim-revenue.rev-token-input-text')}
        address={revenueTokenToClaim}
        onAddressChange={setRevenueTokenToClaim}
      />

      {/* TODO: remove this way of selecting the revenue token to claim */}
      {/* <TxTokenInput
        headerText={t('components.transaction.enable-spigot.revenue-token-to-claim')}
        selectedToken={selectedSellToken!}
        onSelectedTokenChange={onSelectedSellTokenChange}
        tokenOptions={sourceAssetOptions}
        amount="0"
        readOnly={true}
        hideAmount={true}
      /> */}

      {isVerifiedContract ? (
        <>
          <TxFuncSelector
            headerText={t('components.transaction.enable-spigot.function-revenue')}
            typeOptions={funcOptions}
            selectedType={claimFuncType}
            onSelectedTypeChange={onClaimFuncSelection}
          />
          {generateInputFields()}
        </>
      ) : (
        // if no ABI, input bytecode manually
        <>
          <TxByteInput
            headerText={t('components.transaction.enable-spigot.function-revenue')}
            inputText={' '}
            inputError={false}
            byteCode={claimFunc}
            onByteCodeChange={setClaimFunc}
            readOnly={false}
          />
        </>
      )}
      {/* {generateInputFields()} */}
      {/* <GenerateClaimRevenueInputs funcInputs={funcInputs} /> */}
      <TxActions>
        <TxActionButton
          data-testid={`modal-action-claim-revenue`}
          onClick={claimRevenue}
          disabled={false}
          contrast={true}
          isLoading={transactionLoading}
        >
          {t('components.transaction.claim-revenue.cta')}
        </TxActionButton>
      </TxActions>
    </StyledTransaction>
  );
};
