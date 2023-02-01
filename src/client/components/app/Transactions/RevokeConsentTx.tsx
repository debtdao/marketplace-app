import { FC, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';
import { getAddress } from '@ethersproject/address';

import { useAppTranslation, useAppDispatch, useAppSelector } from '@hooks';
import { LinesSelectors, LinesActions, WalletSelectors } from '@store';
import { withdrawUpdate, normalize, toWei, formatAmount, normalizeAmount } from '@src/utils';
import { ACTIVE_STATUS, AddCreditProps, BORROWER_POSITION_ROLE, PROPOSED_STATUS } from '@src/core/types';

import { TxContainer } from './components/TxContainer';
import { TxCreditLineInput } from './components/TxCreditLineInput';
import { TxActionButton } from './components/TxActions';
import { TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';
import { TxTTLInput } from './components/TxTTLInput';
import { TxAddressInput } from './components/TxAddressInput';
import { TxTokenInput } from './components/TxTokenInput';
import { TxRateInput } from './components/TxRateInput';

const StyledTransaction = styled(TxContainer)``;

const StyledAmountInput = styled(TxTTLInput)``;

interface RevokeConsentProps {
  header: string;
  onClose: () => void;
}

export const RevokeConsentTx: FC<RevokeConsentProps> = (props) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const { header, onClose } = props;
  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const [transactionLoading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>(['']);
  // const selectedCredit = useAppSelector(LinesSelectors.selectSelectedLine);
  const linesMap = useAppSelector(LinesSelectors.selectLinesMap);
  const selectedPosition = useAppSelector(LinesSelectors.selectSelectedPosition);
  const selectedProposal = useAppSelector(LinesSelectors.selectSelectedProposal);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);

  if (!selectedProposal || !selectedPosition) {
    return null;
  }

  const [dRate, fRate, deposit, tokenAddress, lenderAddress] = [...selectedProposal!.args];
  const { msgData } = selectedProposal!;
  const targetTokenAmount = normalizeAmount(deposit, selectedPosition!.token.decimals);
  const selectedCredit = linesMap[selectedPosition?.line];

  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  const revokeConsent = () => {
    setLoading(true);
    if (!selectedCredit?.id) {
      setErrors([...errors, 'no selected credit ID']);
      setLoading(false);
      return;
    }
    if (!targetTokenAmount) {
      setErrors([...errors, 'no selected target amount']);
      setLoading(false);
      return;
    }
    if (!selectedPosition) {
      setErrors([...errors, 'no selected position']);
      setLoading(false);
      return;
    }

    dispatch(
      LinesActions.revokeConsent({
        id: selectedPosition.id,
        lineAddress: selectedCredit.id,
        // lineAddress: selectedPosition.line,
        network: walletNetwork,
        msgData: msgData,
      })
    ).then((res) => {
      if (res.meta.requestStatus === 'rejected') {
        setTransactionCompleted(2);
        setLoading(false);
      }
      if (res.meta.requestStatus === 'fulfilled') {
        setTransactionCompleted(1);
        dispatch(
          LinesActions.setProposal({
            lineAddress: selectedCredit.id,
            // lineAddress: selectedPosition.line,
            positionId: selectedPosition.id,
            proposalId: selectedProposal!.id,
            // network: walletNetwork,
          })
        );
        setLoading(false);
      }
    });
  };

  const txActions = [
    {
      label: t('components.transaction.revoke-consent.cta'),
      onAction: revokeConsent,
      status: true,
      disabled: false,
      contrast: false,
    },
  ];

  if (!selectedCredit) {
    console.log('revoke consent modal selected credit is undefined: ', selectedCredit);
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
          transactionCompletedLabel={t('components.transaction.revoke-consent.error-message')}
          exit={onTransactionCompletedDismissed}
        />
      </StyledTransaction>
    );
  }

  const targetBalance = normalizeAmount(selectedPosition!.token.balance, selectedPosition!.token.decimals);
  const tokenHeaderText = `${t('components.transaction.token-input.you-have')} ${formatAmount(targetBalance, 4)}`;

  return (
    <StyledTransaction onClose={onClose} header={header || t('components.transaction.revoke-consent.header')}>
      <TxCreditLineInput
        key={'credit-input'}
        headerText={t('components.transaction.revoke-consent.select-credit')}
        // onSelectedCreditLineChange={onSelectedCreditLineChange}
        selectedCredit={selectedCredit}
        readOnly={true}
      />
      <TxTokenInput
        key={'token-input'}
        headerText={t('components.transaction.revoke-consent.select-token')}
        inputText={tokenHeaderText}
        amount={targetTokenAmount}
        amountValue={toWei(targetTokenAmount, selectedPosition!.token.decimals)}
        selectedToken={selectedPosition!.token}
        readOnly={true}
      />
      <TxAddressInput
        key={'lender-input'}
        headerText={t('components.transaction.revoke-consent.select-lender')}
        inputText={t('components.transaction.revoke-consent.lender-address')}
        address={selectedPosition!.lender}
        readOnly={true}
      />

      <TxRateInput
        key={'frate'}
        headerText={t('components.transaction.revoke-consent.select-rates')}
        frate={fRate}
        drate={dRate}
        amount={selectedPosition!.fRate}
        readOnly={true}
      />

      <TxActions>
        {txActions.map(({ label, onAction, status, disabled, contrast }) => (
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
