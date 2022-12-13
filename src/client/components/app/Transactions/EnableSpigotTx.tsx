import { FC, useState, useEffect } from 'react';
import styled from 'styled-components';
import _ from 'lodash';

import { generateSig } from '@src/utils';
import { isValidAddress } from '@src/utils';
import { useAppTranslation, useAppDispatch, useAppSelector } from '@hooks';
import { ACTIVE_STATUS, AddSpigotProps } from '@src/core/types';
import {
  WalletSelectors,
  LinesSelectors,
  OnChainMetaDataActions,
  CollateralActions,
  CollateralSelectors,
  OnChainMetaDataSelector,
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

  const selectedContractFunctions = useAppSelector(OnChainMetaDataSelector.selectFunctions);
  const contractABI = useAppSelector(OnChainMetaDataSelector.selectABI);
  //state for params
  const { header, onClose } = props;

  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const [transactionLoading, setLoading] = useState(false);

  // spigot setting params
  const [settingClaimFunc, setClaimFunc] = useState('');
  const [settingTransferFunc, setTransferFunc] = useState('');
  const [revenueContractAdd, setRevenueContractAdd] = useState<string>('');
  const [revContractABI, setRevenueContractABI] = useState(false);
  const [claimFuncType, setClaimFuncType] = useState({ id: '', label: '', value: '' });
  const [transferFuncType, setTransferFuncType] = useState({ id: '', label: '', value: '' });

  useEffect(() => {
    // if escrow not set yet then correct state
    if (!selectedSpigot) {
      dispatch(CollateralActions.setSelectedSpigot({ spigotAddress: selectedLine?.spigotId }));
    }
  }, [selectedLine]);

  useEffect(() => {
    if (isValidAddress(revenueContractAdd)) {
      dispatch(OnChainMetaDataActions.getABI(revenueContractAdd));
      setRevenueContractABI(true);
    } else {
      dispatch(OnChainMetaDataActions.clearABI());
      setRevenueContractABI(false);
    }
  }, [revenueContractAdd]);

  // If contract has ABI, these functions generage the bytecode for the functions
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

  // if no ABI, input bytecode manually
  const handleClaimChange = (byteCode: string) => {
    setClaimFunc(byteCode);
  };

  const handleTransferFuncChange = (byteCode: string) => {
    setTransferFunc(byteCode);
  };

  const notArbiter = selectedLine?.status === ACTIVE_STATUS;
  if (!notArbiter) {
    return null;
  }

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
      console.log('enable-spigot', selectedLine?.id, selectedSpigot);
      setLoading(false);
      return;
    }

    console.log('enable-spigot', selectedLine);

    if (!revenueContractAdd) {
      console.log('enable-spigot', revenueContractAdd);
      setLoading(false);
      return;
    }

    if (!walletNetwork) {
      console.log('enable-spigot', !walletNetwork);
      setLoading(false);
      return;
    }

    const transactionData: AddSpigotProps = {
      network: walletNetwork,
      lineAddress: selectedLine.id,
      spigotAddress: selectedSpigot.id,
      revenueContract: revenueContractAdd,
      setting: {
        //TO DO: QUERY OWNERSPLIT ON SPIGOTENTITY
        ownerSplit: '100',
        claimFunction: settingClaimFunc,
        transferOwnerFunction: settingTransferFunc,
      },
    };

    console.log('enable-spigot', transactionData);

    dispatch(CollateralActions.addSpigot(transactionData)).then((res) => {
      if (res.meta.requestStatus === 'rejected') {
        setTransactionCompleted(2);
        setLoading(false);
      }
      if (res.meta.requestStatus === 'fulfilled') {
        setTransactionCompleted(1);
        setLoading(false);
      }
    });
  };

  const handleChangeRevenue = (address: string) => {
    setRevenueContractAdd(address);
  };

  const createListItems = (functions: string[]) => {
    if (!functions) {
      setRevenueContractABI(false);
      return;
    }
    const functionList: any = [];
    functions.forEach((func, i) => {
      const obj = { id: i, label: func, value: '' };
      functionList.push(obj);
    });
    return functionList;
  };

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

  const renderRevFunc = () => {
    if (revContractABI) {
      return (
        <TxFuncSelector
          headerText={t('components.transaction.enable-spigot.function-revenue')}
          typeOptions={createListItems(selectedContractFunctions!)}
          selectedType={claimFuncType}
          onSelectedTypeChange={onClaimFuncSelection}
        ></TxFuncSelector>
      );
    } else {
      return (
        <TxByteInput
          headerText={t('components.transaction.enable-spigot.function-revenue')}
          inputText={' '}
          inputError={false}
          byteCode={settingClaimFunc}
          onByteCodeChange={handleClaimChange}
          readOnly={false}
        />
      );
    }
  };

  const renderTransferFunc = () => {
    if (revContractABI) {
      return (
        <TxFuncSelector
          headerText={t('components.transaction.enable-spigot.function-transfer')}
          inputText={' '}
          typeOptions={createListItems(selectedContractFunctions!)}
          selectedType={transferFuncType}
          onSelectedTypeChange={onTransferFuncSelection}
        ></TxFuncSelector>
      );
    } else {
      return (
        <TxByteInput
          headerText={t('components.transaction.enable-spigot.function-transfer')}
          inputText={' '}
          inputError={false}
          byteCode={settingTransferFunc}
          onByteCodeChange={handleTransferFuncChange}
          readOnly={false}
        />
      );
    }
  };

  return (
    <StyledTransaction onClose={onClose} header={header}>
      <TxAddressInput
        headerText={t('components.transaction.enable-spigot.revenue-contract')}
        address={revenueContractAdd}
        onAddressChange={handleChangeRevenue}
      />
      {renderRevFunc()}
      {renderTransferFunc()}

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
