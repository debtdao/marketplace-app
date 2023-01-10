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
import { GenerateClaimRevenueInputs } from './components/GenerateClaimRevenueInputs';

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
  // const selectedRevenueContract = useAppSelector(CollateralSelectors.selectSelectedRevenueContractAddress);

  // TODO: Comment out hard-coded DPI revenue contract address
  const { revenueContractAddress: selectedRevenueContract } = useAppSelector(ModalSelectors.selectActiveModalProps);
  // DPI revenue contract
  // const selectedRevenueContract = '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b';

  console.log('ClaimRevenueTx - selectedRevenueContract: ', selectedRevenueContract);
  // const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  console.log('Selected Spigot: ', selectedSpigot);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const [claimData, setClaimData] = useState('');
  //const [revContract, setRevContract] = useState(selectedRevenueContract ?? '');
  const contractABI = useAppSelector(OnchainMetaDataSelector.selectABI);
  const selectedContractFunctions = useAppSelector(OnchainMetaDataSelector.selectFunctions);
  const [claimFuncType, setClaimFuncType] = useState({ id: '', label: '', value: '' });
  const [claimFunc, setClaimFunc] = useState<string>('');
  // TODO: fix issue where closing the modal causes claimFunc to be undefined
  // const actualClaimFunc = selectedSpigot.spigots ? selectedSpigot.spigots[selectedRevenueContract].claimFunc : '';

  const [funcInputs, setFuncInputs] = useState<ParamType[]>([]);
  const [userFuncInputs, setUserFuncInputs] = useState<{ [name: string]: any }>({});

  console.log('User Func Inputs: ', userFuncInputs);

  const [didFetchAbi, setDidFetchABI] = useState<boolean>(false);

  const selectedSellTokenAddress = useAppSelector(TokensSelectors.selectSelectedTokenAddress);
  const initialToken: string = selectedSellTokenAddress || ETH;
  const { selectedSellToken, sourceAssetOptions } = useSelectedSellToken({
    selectedSellTokenAddress: initialToken,
    allowTokenSelect: true,
  });

  console.log('selected tokens #1', selectedSellToken, selectedSellTokenAddress);
  const [transactionLoading, setLoading] = useState(false);
  const [selectedTokenAddress, setSelectedTokenAddress] = useState('');
  const [transactionCompleted, setTransactionCompleted] = useState(0);

  useEffect(() => {
    // @cleanup would be great to just do this inside the selectors so we dont have hooks everywhere for same thing
    console.log('how many renders');
    console.log('use effct #1', selectedTokenAddress, selectedSellToken);
    if (!selectedSellToken) {
      dispatch(
        TokensActions.setSelectedTokenAddress({
          tokenAddress: selectedTokenAddress ? selectedTokenAddress : sourceAssetOptions[0].address,
        })
      );
    }
    console.log('use effct #2', selectedTokenAddress, selectedSellToken);
    if (!selectedTokenAddress && selectedSellToken) {
      console.log('set tkn addr', selectedSellToken);
      setSelectedTokenAddress(selectedSellToken.address);
    }
    // }, [dispatch, selectedSellToken, selectedTokenAddress, sourceAssetOptions]);
  }, [selectedSellToken, selectedTokenAddress]);

  console.log('selected revenue contract: ', selectedRevenueContract);
  // useEffect(() => {
  //   console.log('am I here 1?');
  //   if (isValidAddress(selectedRevenueContract)) {
  //     console.log('am I here 2?');
  //     dispatch(OnchainMetaDataActions.getABI(selectedRevenueContract));
  //     // change state of something
  //   }
  // }, []);
  // }, [selectedRevenueContract, didFetchAbi]);
  // console.log('am I here selected revenue contract?');

  //console.log('selected tokens #2', selectedSellToken, selectedSellTokenAddress);

  const onSelectedSellTokenChange = (tokenAddress: string) => {
    console.log('set token', tokenAddress);
    setTargetTokenAmount('');
    dispatch(TokensActions.setSelectedTokenAddress({ tokenAddress }));
  };

  // const onRevContractChange = (address: string) => {
  //   console.log('on rev cont chng', address);

  //   setRevContract(address);
  //   if (address?.length == 42 && getAddress(address)) {
  //     dispatch(CollateralActions.setSelectedRevenueContract({ contractAddress: getAddress(address) }));
  //   }
  // };

  // Event Handlers

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

    if (!selectedSellTokenAddress) {
      console.log('claim rev modal: claimRevenue() - no rev token selected');
      return;
    }
    console.log(
      'Claim Rev Data',
      selectedSpigot.id,
      selectedRevenueContract,
      selectedSellTokenAddress,
      claimFunc,
      walletNetwork
    );

    dispatch(
      CollateralActions.claimRevenue({
        spigotAddress: selectedSpigot.id,
        revenueContract: selectedRevenueContract,
        token: selectedSellTokenAddress,
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
          transactionCompletedLabel={'completed'}
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
          transactionCompletedLabel={'could not add credit'}
          exit={onTransactionCompletedDismissed}
        />
      </StyledTransaction>
    );
  }

  if (!selectedSellToken && !selectedTokenAddress) return null;

  // TODO: Get rid of this dead function.
  const onClaimFuncSelection = (newFunc: { id: string; label: string; value: string }) => {
    const funcInputs = generateClaimFuncInputs(newFunc.label, contractABI[selectedRevenueContract]!);
    console.log('Func Inputs: ', funcInputs);
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
    Array.from(Object.values(selectedContractFunctions[selectedRevenueContract]))!.length !== 0;

  const funcOptions = !selectedContractFunctions[selectedRevenueContract]
    ? []
    : Array.from(Object.values(selectedContractFunctions[selectedRevenueContract])).map((func, i) => ({
        id: i.toString(),
        label: func,
        value: '',
      }));
  console.log('Func Options: ', funcOptions);

  const handleInputChange = (name: string, type: string, value: any) => {
    console.log('handle input change', name, value);
    let newUserFuncInputs = { ...userFuncInputs };
    newUserFuncInputs[name] = value;
    setUserFuncInputs(newUserFuncInputs);
    console.log('handle input change: ', userFuncInputs);
  };

  const generateInputFields = () => {
    if (funcInputs.length === 0) {
      return <></>;
    }
    const inputFieldsHTML = [];
    for (let i = 0; i < funcInputs.length; i++) {
      const input = funcInputs[i];
      if (input.type.includes('int')) {
        inputFieldsHTML.push(
          <TxNumberInput
            headerText={input.name}
            amount={userFuncInputs[input.name] ?? ''}
            placeholder={'0'}
            onInputChange={(e: any) => handleInputChange(input.name, input.type, e)}
          />
        );
      }
      if (input.type === 'address') {
        inputFieldsHTML.push(
          <TxAddressInput
            headerText={input.name}
            address={userFuncInputs[input.name] ?? ''}
            onAddressChange={(e: any) => handleInputChange(input.name, input.type, e)}
          />
        );
      }
      if (input.type === 'bytes') {
        inputFieldsHTML.push(
          <TxByteInput
            headerText={input.name}
            byteCode={userFuncInputs[input.name] ?? ''}
            onByteCodeChange={(e: any) => handleInputChange(input.name, input.type, e)}
          />
        );
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
    // <div />
    <StyledTransaction onClose={onClose} header={header}>
      <TxAddressInput
        headerText={t('components.transaction.enable-spigot.revenue-contract')}
        address={selectedRevenueContract}
        //onAddressChange={onRevContractChange}
      />
      <TxTokenInput
        headerText={t('components.transaction.claim-revenue.rev-token-input-header')}
        selectedToken={selectedSellToken!}
        onSelectedTokenChange={onSelectedSellTokenChange}
        tokenOptions={sourceAssetOptions}
        amount="0" // todo simulate how many tokens will be claimed and add value here
        readOnly={true}
      />

      {isVerifiedContract ? (
        <>
          <TxFuncSelector
            headerText={t('components.transaction.enable-spigot.function-revenue')}
            typeOptions={funcOptions}
            selectedType={claimFuncType}
            onSelectedTypeChange={onClaimFuncSelection}
          />
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
      {generateInputFields()}
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
