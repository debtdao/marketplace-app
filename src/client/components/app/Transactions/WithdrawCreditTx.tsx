import { FC, useState } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';

import {
  useAppTranslation,
  useAppDispatch,
  // used to dummy token for dev
  useAppSelector,
} from '@hooks';
import { LinesSelectors, LinesActions, WalletSelectors } from '@store';
import { withdrawUpdate, normalize, toWei } from '@src/utils';

import { TxContainer } from './components/TxContainer';
import { TxCreditLineInput } from './components/TxCreditLineInput';
import { TxActionButton } from './components/TxActions';
import { TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';
import { TxTTLInput } from './components/TxTTLInput';

const StyledTransaction = styled(TxContainer)``;

const StyledAmountInput = styled(TxTTLInput)``;

interface BorrowCreditProps {
  header: string;
  onClose: () => void;
  onSelectedCreditLineChange: Function;
  onPositionChange: (data: { credit?: string; amount?: string }) => void;
}

export const WithdrawCreditTx: FC<BorrowCreditProps> = (props) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const { header, onClose, onPositionChange } = props;
  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const [transactionLoading, setLoading] = useState(false);
  const [targetAmount, setTargetAmount] = useState('1');
  const [errors, setErrors] = useState<string[]>(['']);
  const selectedCredit = useAppSelector(LinesSelectors.selectSelectedLine);
  const selectedPosition = useAppSelector(LinesSelectors.selectSelectedPosition);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const setSelectedCredit = (lineAddress: string) => dispatch(LinesActions.setSelectedLineAddress({ lineAddress }));
  const positions = useAppSelector(LinesSelectors.selectPositionsForLine);

  //Calculate maximum withdraw amount, then humanize for readability
  const getMaxWithdraw = () => {
    if (!selectedPosition) {
      setErrors([...errors, 'no selected position']);
      return '0';
    }
    let maxWithdraw: string = `${Number(selectedPosition.deposit) - Number(selectedPosition.principal)}`;
    maxWithdraw = normalize('amount', maxWithdraw, selectedPosition.token.decimals);
    return maxWithdraw;
  };

  //Used to determine if amount user wants to withdraw is valid
  const isWithdrawable = () => {
    if (!selectedPosition) {
      return;
    }
    const maxWithdrawAmount = Number(toWei(getMaxWithdraw()!, selectedPosition.token.decimals));
    const amountToWithdraw = Number(toWei(targetAmount, selectedPosition.token.decimals));

    return amountToWithdraw > maxWithdrawAmount;
  };

  const _updatePosition = () =>
    onPositionChange({
      credit: selectedCredit?.id,
      amount: targetAmount,
    });

  // Event Handlers
  const onAmountChange = (amount: string): void => {
    setTargetAmount(amount);
    _updatePosition();
  };

  const onSelectedCreditLineChange = (addr: string): void => {
    setSelectedCredit(addr);
    _updatePosition();
  };

  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  const withdrawCredit = () => {
    setLoading(true);
    if (!selectedCredit?.id) {
      setErrors([...errors, 'no selected credit ID']);
      setLoading(false);
      return;
    }
    if (!targetAmount) {
      setErrors([...errors, 'no selected target amount']);
      setLoading(false);
      return;
    }
    if (!selectedPosition) {
      setErrors([...errors, 'no selected position']);
      setLoading(false);
      return;
    }
    if (!walletNetwork) {
      setErrors([...errors, 'wallet not connected']);
      setLoading(false);
      return;
    }
    if (!positions) {
      setErrors([...errors, 'no positions available']);
      setLoading(false);
      return;
    }

    dispatch(
      LinesActions.withdrawLine({
        id: selectedPosition.id,
        lineAddress: selectedCredit.id,
        amount: ethers.utils.parseEther(targetAmount),
        network: walletNetwork,
      })
    ).then((res) => {
      if (res.meta.requestStatus === 'rejected') {
        setTransactionCompleted(2);
        setLoading(false);
      }
      if (res.meta.requestStatus === 'fulfilled') {
        setTransactionCompleted(1);
        const updatedPosition = withdrawUpdate(selectedPosition, targetAmount);
        dispatch(
          LinesActions.setPositionData({
            position: selectedPosition.id,
            lineAddress: selectedCredit.id,
            positionObject: updatedPosition,
            positions: positions,
          })
        );
        setLoading(false);
      }
    });
  };

  const txActions = [
    {
      label: t('components.transaction.withdraw'),
      onAction: withdrawCredit,
      status: true,
      disabled: isWithdrawable(),
      contrast: false,
    },
  ];

  if (!selectedCredit) return null;

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
          transactionCompletedLabel={'could not borrow credit'}
          exit={onTransactionCompletedDismissed}
        />
      </StyledTransaction>
    );
  }

  return (
    <StyledTransaction onClose={onClose} header={header || t('components.transaction.withdraw-credit.header')}>
      <TxCreditLineInput
        key={'credit-input'}
        headerText={t('components.transaction.withdraw-credit.select-line')}
        inputText={t('components.transaction.withdraw-credit.select-line')}
        onSelectedCreditLineChange={onSelectedCreditLineChange}
        selectedCredit={selectedCredit}
        // creditOptions={sourceCreditOptions}
        // inputError={!!sourceStatus.error}
        readOnly={false}
        // displayGuidance={displaySourceGuidance}
      />
      <StyledAmountInput
        headerText={t('components.transaction.withdraw-credit.select-amount')}
        inputText={t('')}
        inputError={false}
        amount={targetAmount}
        onAmountChange={onAmountChange}
        maxAmount={getMaxWithdraw()}
        maxLabel={'Max'}
        readOnly={false}
        hideAmount={false}
        loading={false}
        loadingText={''}
        ttlType={false}
      />
      <TxActions>
        {txActions.map(({ label, onAction, disabled, contrast }) => (
          <TxActionButton
            key={label}
            data-testid={`modal-action-${label.toLowerCase()}`}
            onClick={onAction}
            disabled={disabled}
            contrast={contrast}
            isLoading={transactionLoading}
          >
            {label}
          </TxActionButton>
        ))}
      </TxActions>
    </StyledTransaction>
  );
};
