import { FC, useState, useEffect } from 'react';
import styled from 'styled-components';
import _ from 'lodash';

import { generateSig } from '@src/utils';
import { isValidAddress, toWei } from '@src/utils';
import { useAppTranslation, useAppDispatch, useAppSelector } from '@hooks';
import { ACTIVE_STATUS, AddSpigotProps } from '@src/core/types';
import {
  WalletSelectors,
  LinesSelectors,
  OnchainMetaDataActions,
  CollateralActions,
  CollateralSelectors,
  OnchainMetaDataSelector,
} from '@store';

import { TxContainer } from './components/TxContainer';
import { TxActionButton } from './components/TxActions';
import { TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';
import { TxAddressInput } from './components/TxAddressInput';
import { TxByteInput } from './components/TxByteInput';
import { TxFuncSelector } from './components/TxFuncSelector';
import { TxNumberInput } from './components/TxNumberInput';

const StyledTransaction = styled(TxContainer)`
  min-height: 60vh;
`;

interface EnableSpigotTxProps {
  header: string;
  onClose: () => void;
}

export const EnableSpigotTx: FC<EnableSpigotTxProps> = (props) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();

  // user data
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  //Line data
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  const selectedSpigot = useAppSelector(CollateralSelectors.selectSelectedSpigot);

  const selectedContractFunctions = useAppSelector(OnchainMetaDataSelector.selectFunctions);
  const contractABI = useAppSelector(OnchainMetaDataSelector.selectABI);
  //state for params
  const { header, onClose } = props;

  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const [transactionLoading, setLoading] = useState(false);

  // spigot setting params
  const [claimFunc, setClaimFunc] = useState<string>('');
  const [transferFunc, setTransferFunc] = useState<string>('');
  const [revenueContractAddy, setRevenueContractAdd] = useState<string>('');
  const [inputWarning, setWarning] = useState('');

  const [didFetchAbi, setDidFetchABI] = useState<boolean>(false);
  const [claimFuncType, setClaimFuncType] = useState({ id: '', label: '', value: '' });
  const [transferFuncType, setTransferFuncType] = useState({ id: '', label: '', value: '' });
  const [revenueSplit, setRevenueSplit] = useState(selectedLine?.defaultSplit ?? '0');

  useEffect(() => {
    // if escrow not set yet then correct state
    if (!selectedSpigot && selectedLine?.spigotId) {
      dispatch(CollateralActions.setSelectedSpigot({ spigotAddress: selectedLine.spigotId }));
    }
  }, [selectedSpigot, selectedLine]);

  useEffect(() => {
    if (isValidAddress(revenueContractAddy)) {
      dispatch(OnchainMetaDataActions.getABI(revenueContractAddy));
    }
  }, [revenueContractAddy, didFetchAbi]);

  // // If contract has ABI, these functions generage the bytecode for the functions
  const onTransferFuncSelection = (newFunc: { id: string; label: string; value: string }) => {
    const hashedSigFunc = generateSig(newFunc.label, contractABI[revenueContractAddy]!);
    setTransferFunc(hashedSigFunc);
    setTransferFuncType(newFunc);
  };

  const onClaimFuncSelection = (newFunc: { id: string; label: string; value: string }) => {
    const hashedSigFunc = generateSig(newFunc.label, contractABI[revenueContractAddy]!);
    setClaimFunc(hashedSigFunc);
    setClaimFuncType(newFunc);
  };

  // Event Handlers
  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  const onRevenueSplitChange = (amount: string) => {
    setRevenueSplit(amount);
  };

  const enableSpigot = () => {
    setLoading(true);

    if (!selectedLine || !selectedSpigot) {
      setLoading(false);
      return;
    }

    if (!revenueContractAddy) {
      setLoading(false);
      return;
    }

    if (!walletNetwork) {
      setLoading(false);
      return;
    }

    if (transferFunc === '0x00000000') {
      setWarning('TransferFunc cannot be null selector');
      return;
    }

    if (revenueSplit > selectedLine.defaultSplit) {
      // Is this right?
      setWarning('Revenue Contract split exceeds default split');
      return;
    }

    if (revenueContractAddy === selectedSpigot.id) {
      setWarning('Revenue Contract cannot be the same address as the Spigot');
      return;
    }

    const transactionData: AddSpigotProps = {
      network: walletNetwork,
      lineAddress: selectedLine.id,
      spigotAddress: selectedSpigot.id,
      revenueContract: revenueContractAddy,
      setting: {
        // TODO: create unit test for usage of toWei
        ownerSplit: toWei(revenueSplit, 0),
        claimFunction: claimFunc,
        transferOwnerFunction: transferFunc,
      },
    };

    dispatch(CollateralActions.addSpigot(transactionData)).then((res) => {
      if (res.meta?.requestStatus === 'rejected') {
        setTransactionCompleted(2);
        setLoading(false);
      }
      if (res.meta?.requestStatus === 'fulfilled') {
        setTransactionCompleted(1);
        setLoading(false);
      }
    });
  };

  if (!selectedLine) return null;

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
          transactionCompletedLabel={t('components.transaction.enable-spigot.enable-failed')}
          exit={onTransactionCompletedDismissed}
        />
      </StyledTransaction>
    );
  }

  const isVerifiedContract =
    isValidAddress(revenueContractAddy) &&
    contractABI &&
    selectedContractFunctions[revenueContractAddy] !== undefined &&
    Object.values(selectedContractFunctions[revenueContractAddy])!.length !== 0;
  const funcOptions = !selectedContractFunctions[revenueContractAddy]
    ? []
    : Object.values(selectedContractFunctions[revenueContractAddy]).map((func, i) => ({
        id: i.toString(),
        label: func,
        value: '',
      }));

  return (
    // <div />
    <StyledTransaction onClose={onClose} header={header}>
      <TxAddressInput
        headerText={t('components.transaction.enable-spigot.revenue-contract')}
        address={revenueContractAddy}
        onAddressChange={setRevenueContractAdd}
      />
      {inputWarning !== '' ? <div style={{ color: '#C3272B' }}>{inputWarning}</div> : ''}

      {isVerifiedContract ? (
        <>
          <TxFuncSelector
            headerText={t('components.transaction.enable-spigot.function-transfer')}
            typeOptions={funcOptions}
            selectedType={transferFuncType}
            onSelectedTypeChange={onTransferFuncSelection}
          />
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
            headerText={t('components.transaction.enable-spigot.function-transfer')}
            inputText={' '}
            inputError={false}
            byteCode={transferFunc}
            onByteCodeChange={setTransferFunc}
            readOnly={false}
          />
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
      <TxNumberInput
        headerText={t('components.transaction.deploy-line.revenue-split')}
        inputLabel={t('components.transaction.deploy-line.revenue-split-input')}
        width={'sm'}
        placeholder={selectedLine.defaultSplit}
        amount={revenueSplit}
        maxAmount={'max string'}
        onInputChange={onRevenueSplitChange}
        readOnly={false}
        hideAmount={false}
        inputError={false}
      />
      <TxActions>
        <TxActionButton
          key={t('components.transaction.enable-spigot.cta') as string}
          data-testid={`modal-action-${t('components.transaction.enable-spigot.cta').toLowerCase()}`}
          onClick={enableSpigot}
          disabled={false}
          contrast={true}
          isLoading={transactionLoading}
        >
          {t('components.transaction.enable-spigot.cta')}
        </TxActionButton>
      </TxActions>
    </StyledTransaction>
  );
};
