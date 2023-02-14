import { FC, useState } from 'react';
import styled from 'styled-components';
import { BigNumber, ethers } from 'ethers';

import {
  useAppTranslation,
  useAppDispatch,
  // used to dummy token for dev
  useAppSelector,
} from '@hooks';
import { LinesSelectors, LinesActions, WalletSelectors } from '@store';
import { withdrawUpdate, normalize, toWei } from '@src/utils';
import { getConstants } from '@src/config/constants';
import { ACTIVE_STATUS, AddCreditProps, BORROWER_POSITION_ROLE, PROPOSED_STATUS } from '@src/core/types';

import { TxContainer } from './components/TxContainer';
import { TxCreditLineInput } from './components/TxCreditLineInput';
import { TxActionButton } from './components/TxActions';
import { TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';
import { TxTTLInput } from './components/TxTTLInput';
import { TxRateInput } from './components/TxRateInput';

const {
  CONTRACT_ADDRESSES: { DAI },
  MAX_INTEREST_RATE,
} = getConstants();

const StyledTransaction = styled(TxContainer)``;

const StyledAmountInput = styled(TxTTLInput)``;

interface BorrowCreditProps {
  header: string;
  onClose: () => void;
  onSelectedCreditLineChange: Function;
  onPositionChange: (data: { credit?: string; amount?: string }) => void;
}

interface SetRateProps {
  header: string;
  onClose: () => void;
  acceptingOffer?: boolean;
  onSelectedCreditLineChange: Function;
  onPositionChange: (data: { credit?: string; amount?: string }) => void;
}

export const SetRatesTx: FC<SetRateProps> = (props) => {
  const userMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const { header, onClose, onPositionChange } = props;
  const [transactionLoading, setLoading] = useState(false);
  const [targetAmount, setTargetAmount] = useState('1');
  const [errors, setErrors] = useState<string[]>(['']);
  const selectedCredit = useAppSelector(LinesSelectors.selectSelectedLine);
  const selectedPosition = useAppSelector(LinesSelectors.selectSelectedPosition);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const setSelectedCredit = (lineAddress: string) => dispatch(LinesActions.setSelectedLineAddress({ lineAddress }));
  const positions = useAppSelector(LinesSelectors.selectPositionsForSelectedLine);
  const [drate, setDrate] = useState('0');
  const [frate, setFrate] = useState('0');

  const acceptingOffer = props.acceptingOffer || (userMetadata.role === BORROWER_POSITION_ROLE && !!selectedPosition);

  if (!selectedPosition) {
    return null;
  }

  //Calculate maximum withdraw amount, then humanize for readability
  const getMaxWithdraw = () => {
    if (!selectedPosition) {
      setErrors([...errors, 'no selected position']);
      return '0';
    }
    const deposit: BigNumber = BigNumber.from(selectedPosition.deposit);
    const principal: BigNumber = BigNumber.from(selectedPosition.principal);
    const interestRepaid: BigNumber = BigNumber.from(selectedPosition.interestRepaid);
    const maxWithdrawAmount = deposit.sub(principal).add(interestRepaid);
    const maxWithdrawAmountLessDust = maxWithdrawAmount.gte(1) ? maxWithdrawAmount.sub(1) : BigNumber.from(0);
    const maxWithdrawLessDustNormalized = normalize(
      'amount',
      maxWithdrawAmountLessDust.toString(),
      selectedPosition.token.decimals
    );
    return maxWithdrawLessDustNormalized;
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

  const onRateChange = (type: string, amount: string): void => {
    if (type === 'd') setDrate(amount);
    if (type === 'f') setFrate(amount);
  };

  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  const setRates = () => {
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
      LinesActions.setRates({
        id: selectedPosition.id,
        lineAddress: selectedCredit.id,
        frate: frate,
        drate: drate,
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
          LinesActions.setPosition({
            id: selectedPosition.id,
            position: updatedPosition,
          })
        );
        setLoading(false);
      }
    });
  };

  const txActions = [
    {
      label: t('components.transaction.set-rates'),
      onAction: setRates,
      status: true,
      disabled: false,
      contrast: false,
    },
  ];

  if (!selectedCredit) {
    console.log('withdraw modal selected credit is undefined: ', selectedCredit);
    return null;
  }

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
          transactionCompletedLabel={t('components.transaction.withdraw-credit.error-message')}
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
        readOnly={true}
        // displayGuidance={displaySourceGuidance}
      />
      <TxRateInput
        key={'frate'}
        headerText={t('components.transaction.add-credit.select-rates')}
        frate={frate}
        drate={drate}
        amount={frate}
        maxAmount={MAX_INTEREST_RATE.toString()}
        setRateChange={onRateChange}
        readOnly={acceptingOffer}
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
