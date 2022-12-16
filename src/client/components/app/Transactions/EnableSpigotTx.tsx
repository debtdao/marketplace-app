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
  const [claimFunc, setClaimFunc] = useState('');
  const [transferFunc, setTransferFunc] = useState('');
  const [revenueContractAdd, setRevenueContractAdd] = useState<string>('');
  // TODO select ABI form onchain metadata state
  const [revContractABI, setRevenueContractABI] = useState(false);
  const [claimFuncType, setClaimFuncType] = useState({ id: '', label: '', value: '' });
  const [transferFuncType, setTransferFuncType] = useState({ id: '', label: '', value: '' });

  useEffect(() => {
    // if escrow not set yet then correct state
    if (!selectedSpigot && selectedLine?.spigotId) {
      dispatch(CollateralActions.setSelectedSpigot({ spigotAddress: selectedLine.spigotId }));
    }
  }, [selectedSpigot, selectedLine]);

  useEffect(() => {
    if (isValidAddress(revenueContractAdd)) {
      dispatch(OnchainMetaDataActions.getABI(revenueContractAdd));
      setRevenueContractABI(true);
      // }
    } else {
      setRevenueContractABI(false);
      dispatch(OnchainMetaDataActions.clearABI());
    }
  }, [revenueContractAdd]);

  // // If contract has ABI, these functions generage the bytecode for the functions
  const onTransferFuncSelection = (newFunc: { id: string; label: string; value: string }) => {
    const hashedSigFunc = generateSig(newFunc.label, contractABI!);
    setTransferFunc(hashedSigFunc);
    setTransferFuncType(newFunc);
  };

  const onClaimFuncSelection = (newFunc: { id: string; label: string; value: string }) => {
    const hashedSigFunc = generateSig(newFunc.label, contractABI!);
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

  const enableSpigot = () => {
    setLoading(true);

    if (!selectedLine || !selectedSpigot) {
      setLoading(false);
      return;
    }

    if (!revenueContractAdd) {
      setLoading(false);
      return;
    }

    if (!walletNetwork) {
      setLoading(false);
      return;
    }

    const transactionData: AddSpigotProps = {
      network: walletNetwork,
      lineAddress: selectedLine.id,
      spigotAddress: selectedSpigot.id,
      revenueContract: revenueContractAdd,
      setting: {
        // TODO: QUERY OWNERSPLIT ON SPIGOTENTITY
        ownerSplit: toWei('100', 0),
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

  const createListItems = (functions: string[]) =>
    !functions ? [] : functions.map((func, i) => ({ id: i.toString(), label: func, value: '' }));

  if (!selectedLine) return null;

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
          transactionCompletedLabel={t('components.transaction.enable-spigot.enable-failed')}
          exit={onTransactionCompletedDismissed}
        />
      </StyledTransaction>
    );
  }

  const revFuncDisplayConfigs = [
    {
      header: t('components.transaction.enable-spigot.function-transfer'),
      options: createListItems(selectedContractFunctions!),
      type: transferFuncType,
      onChange: onTransferFuncSelection,
      byteCode: transferFunc,
      onByteChange: setTransferFunc,
    },
    {
      header: t('components.transaction.enable-spigot.function-revenue'),
      options: createListItems(selectedContractFunctions!),
      type: claimFuncType,
      onChange: onClaimFuncSelection,
      byteCode: claimFunc,
      onByteChange: setClaimFunc,
    },
  ];

  const renderFuncSelectors = () =>
    revFuncDisplayConfigs.map(({ header, byteCode, options, type, onChange, onByteChange }) =>
      // if no ABI, input bytecode manually
      revContractABI ? (
        <TxFuncSelector
          key={header + String(type)}
          headerText={header}
          typeOptions={options}
          selectedType={type}
          onSelectedTypeChange={onChange}
        />
      ) : (
        <TxByteInput
          key={header + byteCode}
          headerText={header}
          inputText={' '}
          inputError={false}
          byteCode={byteCode}
          onByteCodeChange={onByteChange}
          readOnly={false}
        />
      )
    );

  console.log('render enable spigot', transactionLoading, revenueContractAdd);
  return (
    // <div />
    <StyledTransaction onClose={onClose} header={header}>
      <TxAddressInput
        headerText={t('components.transaction.enable-spigot.revenue-contract')}
        address={revenueContractAdd}
        onAddressChange={setRevenueContractAdd}
      />
      {renderFuncSelectors()}

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
