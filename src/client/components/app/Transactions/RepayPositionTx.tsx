import { FC, useState, useEffect } from 'react';
import styled from 'styled-components';
import { BigNumber, ethers } from 'ethers';

import { formatAmount, normalizeAmount, toWei, depositAndRepayUpdate, normalize } from '@utils';
import { useAppTranslation, useAppDispatch, useAppSelector, useSelectedSellToken } from '@hooks';
import { TokensActions, TokensSelectors, VaultsSelectors, LinesSelectors, LinesActions, WalletSelectors } from '@store';
import { getConstants, testTokens } from '@src/config/constants';
import { CreditPosition } from '@src/core/types';

import { TxContainer } from './components/TxContainer';
import { TxTokenInput } from './components/TxTokenInput';
import { TxActionButton } from './components/TxActions';
import { TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';
import { TxRateInput } from './components/TxRateInput';
import { TxDropdown } from './components/TxDropdown';
import { TxPositionInput } from './components/TxPositionInput';

const StyledTransaction = styled(TxContainer)``;

interface RepayPositionProps {
  header: string;
  onClose: () => void;
  acceptingOffer: boolean;
  onSelectedCreditLineChange: Function;
  onPositionChange: (data: { credit?: string; token: string | undefined; amount?: string }) => void;
}

export const RepayPositionTx: FC<RepayPositionProps> = (props) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const { acceptingOffer, header, onClose, onPositionChange } = props;
  const repaymentOptions = [
    {
      id: 'close',
      label: t('components.transaction.repay.close.title'),
      value: t('components.transaction.repay.close.title'),
    },
    {
      id: 'deposit-and-repay',
      label: t('components.transaction.repay.deposit-and-repay.title'),
      value: t('components.transaction.repay.deposit-and-repay.title'),
    },
    {
      id: 'deposit-and-close',
      label: t('components.transaction.repay.deposit-and-close.title'),
      value: t('components.transaction.repay.deposit-and-close.title'),
    },
    {
      id: 'unused',
      label: t('components.transaction.repay.unused.title'),
      value: t('components.transaction.repay.unused.title'),
    },
    {
      id: 'claim-and-repay',
      label: t('components.transaction.repay.claim-and-repay.title'),
      value: t('components.transaction.repay.claim-and-repay.title'),
    },
    {
      id: 'claim-and-trade',
      label: t('components.transaction.repay.claim-and-trade.title'),
      value: t('components.transaction.repay.claim-and-trade.title'),
    },
  ];

  const [repayType, setRepayType] = useState(repaymentOptions[0]);
  const selectedPosition = useAppSelector(LinesSelectors.selectSelectedPosition);
  const userMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const [transactionLoading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>(['']);
  const [transactionApproved, setTransactionApproved] = useState(true);
  const [targetAmount, setTargetAmount] = useState('1');
  const selectedCredit = useAppSelector(LinesSelectors.selectSelectedLine);
  const [selectedTokenAddress, setSelectedTokenAddress] = useState('');
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  //const setSelectedCredit = (lineAddress: string) => dispatch(LinesActions.setSelectedLineAddress({ lineAddress }));
  const selectedSellTokenAddress = useAppSelector(TokensSelectors.selectSelectedTokenAddress);
  const initialToken: string = selectedSellTokenAddress ?? selectedPosition!.token.address;
  const positions = useAppSelector(LinesSelectors.selectPositionsForSelectedLine);

  const { selectedSellToken, sourceAssetOptions } = useSelectedSellToken({
    selectedSellTokenAddress: initialToken,
    selectedVaultOrLab: useAppSelector(VaultsSelectors.selectRecommendations)[0],
    allowTokenSelect: true,
  });

  useEffect(() => {
    console.log('repay type', repayType);
  }, [repayType]);

  useEffect(() => {
    if (!selectedSellToken) {
      dispatch(
        TokensActions.setSelectedTokenAddress({
          tokenAddress: sourceAssetOptions[0].address,
        })
      );
    }
    if (selectedTokenAddress === '' && selectedSellToken) {
      setSelectedTokenAddress(selectedSellToken.address);
    }

    if (
      !selectedCredit ||
      !selectedSellToken
      // toBN(targetTokenAmount).lte(0) ||
      // inputError ||
    ) {
      return;
    }

    dispatch(TokensActions.getTokensDynamicData({ addresses: [initialToken] })); // pulled from DepositTX, not sure why data not already filled
    // dispatch(CreditLineActions.getCreditLinesDynamicData({ addresses: [initialToken] })); // pulled from DepositTX, not sure why data not already filled
  }, [selectedSellToken]);

  // Event Handlers

  const onAmountChange = (amount: string): void => {
    setTargetAmount(amount);
    // _updatePosition();
  };

  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  const approveDepositAndRepay = () => {
    setLoading(true);
    if (!selectedCredit?.id || !selectedPosition) {
      setLoading(false);
      return;
    }
    let approvalOBj = {
      lineAddress: selectedCredit.id,
      tokenAddress: selectedSellTokenAddress!,
      amount: toWei(targetAmount, selectedPosition.token.decimals),
      network: walletNetwork!,
    };
    dispatch(LinesActions.approveDeposit(approvalOBj)).then((res) => {
      if (res.meta.requestStatus === 'rejected') {
        setTransactionApproved(transactionApproved);
        setLoading(false);
      }
      if (res.meta.requestStatus === 'fulfilled') {
        setTransactionApproved(!transactionApproved);
        setLoading(false);
      }
    });
  };

  const depositAndRepay = () => {
    setLoading(true);
    // TODO set error in state to display no line selected
    if (!selectedCredit?.id) {
      setErrors([...errors, 'no selected credit ID']);
      setLoading(false);
      return;
    }
    if (!selectedSellTokenAddress) {
      setErrors([...errors, 'no selected token']);
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

    console.log('repayTX', selectedCredit.id);

    dispatch(
      LinesActions.depositAndRepay({
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
        const updatedPosition = depositAndRepayUpdate(selectedPosition, targetAmount);
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

  const depositAndClose = () => {
    setLoading(true);
    // TODO set error in state to display no line selected
    if (!selectedCredit?.id || !selectedPosition || !walletNetwork) {
      setLoading(false);
      return;
    }

    dispatch(
      LinesActions.depositAndClose({
        lineAddress: selectedCredit.id,
        id: selectedPosition.id,
        network: walletNetwork,
      })
    ).then((res) => {
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

  const claimAndRepay = () => {
    setLoading(true);
    // TODO set error in state to display no line selected
    if (!selectedCredit?.id || !targetAmount || !selectedSellTokenAddress || !walletNetwork) {
      setLoading(false);
      return;
    }

    dispatch(
      LinesActions.claimAndRepay({
        lineAddress: selectedCredit.id,
        claimToken: selectedSellTokenAddress,
        calldata: '',
        network: walletNetwork,
      })
    ).then((res) => {
      if (res.meta.requestStatus === 'rejected') {
        setTransactionCompleted(2);
        setLoading(false);
      }
      if (res.meta.requestStatus === 'fulfilled') {
        setTransactionCompleted(1);
        window.location.reload();
        setLoading(false);
      }
    });
  };

  const claimAndTrade = () => {
    setLoading(true);
    // TODO set error in state to display no line selected
    if (!selectedCredit?.id || !targetAmount || !selectedSellTokenAddress || !walletNetwork) {
      setLoading(false);
      return;
    }

    dispatch(
      LinesActions.claimAndTrade({
        lineAddress: selectedCredit.id,
        claimToken: selectedSellTokenAddress,
        calldata: '',
        network: walletNetwork,
      })
    ).then((res) => {
      if (res.meta.requestStatus === 'rejected') {
        setTransactionCompleted(2);
        setLoading(false);
      }
      if (res.meta.requestStatus === 'fulfilled') {
        setTransactionCompleted(1);
        window.location.reload();
        setLoading(false);
      }
    });
  };

  const useAndRepay = () => {
    setLoading(true);
    // TODO set error in state to display no line selected
    if (!selectedCredit?.id || !targetAmount || !selectedSellTokenAddress || !walletNetwork) {
      setLoading(false);
      return;
    }

    // dispatch(
    //   LinesActions.useAndRepay({
    //     lineAddress: selectedCredit.id,
    //     amount: BigNumber.from(targetAmount),
    //     network: walletNetwork,
    //   })
    // ).then((res) => {
    //   if (res.meta.requestStatus === 'rejected') {
    //     setTransactionCompleted(2);
    //     setLoading(false);
    //   }
    //   if (res.meta.requestStatus === 'fulfilled') {
    //     setTransactionCompleted(1);
    //     window.location.reload();
    //     setLoading(false);
    //   }
    // });
  };

  const closePosition = () => {
    setLoading(true);
    // TODO set error in state to display no line selected
    if (!selectedCredit || !selectedPosition || !targetAmount || !selectedSellTokenAddress || !walletNetwork) {
      setLoading(false);
      return;
    }

    dispatch(
      LinesActions.close({
        lineAddress: selectedCredit.id,
        id: selectedPosition.id,
        network: walletNetwork,
      })
    ).then((res) => {
      if (res.meta.requestStatus === 'rejected') {
        setTransactionCompleted(2);
        setLoading(false);
      }
      if (res.meta.requestStatus === 'fulfilled') {
        setTransactionCompleted(1);
        window.location.reload();
        setLoading(false);
      }
    });
  };

  const getActionsForRepayType = (type: { id: string; label: string; value: string }) => {
    // @cleanup TODO refactor and simplify
    switch (type.id) {
      case 'close':
        return [
          {
            label: t('components.repay.close.cta'),
            onAction: closePosition,
            status: true,
            disabled: transactionApproved,
            contrast: false,
          },
        ];
      case 'deposit-and-close':
        return [
          {
            label: t('components.repay.close.cta'),
            onAction: depositAndClose,
            status: true,
            disabled: transactionApproved,
            contrast: false,
          },
        ];
      case 'unused':
        return [
          {
            label: t('components.repay.cta'),
            onAction: useAndRepay,
            status: true,
            disabled: transactionApproved,
            contrast: false,
          },
        ];
      case 'claim-and-repay':
        return [
          {
            label: t('components.repay.claim-and-repay.cta'),
            onAction: claimAndRepay,
            status: true,
            disabled: transactionApproved,
            contrast: false,
          },
        ];
      case 'claim-and-trade':
        return [
          {
            label: t('components.repay.claim-and-trade.cta'),
            onAction: claimAndTrade,
            status: true,
            disabled: transactionApproved,
            contrast: false,
          },
        ];
      case 'deposit-and-repay':
      default:
        return [
          {
            label: t('components.transaction.approve'),
            onAction: approveDepositAndRepay,
            status: true,
            disabled: !transactionApproved,
            contrast: false,
          },
          {
            label: t('components.repay.deposit-and-repay.cta'),
            onAction: depositAndRepay,
            status: true,
            disabled: transactionApproved,
            contrast: false,
          },
        ];
    }
  };

  //const onSelectedCreditLineChange = (addr: string): void => {
  //  setSelectedCredit(addr);
  //  _updatePosition();
  //};

  const onSelectedTypeChange = (newRepayType: any): void => {
    setRepayType(newRepayType);
    // _updatePosition();
  };

  const onSelectedPositionChange = (arg: CreditPosition): void => {
    dispatch(LinesActions.setSelectedLinePosition({ position: arg.id }));
  };

  if (!selectedCredit || selectedPosition === undefined) return null;
  if (!selectedSellToken) return null;

  const onSelectedSellTokenChange = (tokenAddress: string) => {
    dispatch(TokensActions.setSelectedTokenAddress({ tokenAddress }));
  };

  //Calculate maximum repay amount, then humanize for readability
  const getMaxRepay = () => {
    if (!selectedPosition) {
      setErrors([...errors, 'no selected position']);
      return;
    }
    let maxRepay: string = `${Number(selectedPosition.principal) + Number(selectedPosition.interestAccrued)}`;
    maxRepay = normalize('amount', `${maxRepay}`, selectedPosition.token.decimals);
    return maxRepay;
  };

  const targetBalance = normalizeAmount(selectedSellToken.balance, selectedSellToken.decimals);

  const tokenHeaderText = `${t('components.transaction.token-input.you-have')} ${formatAmount(targetBalance, 4)} ${
    selectedSellToken.symbol
  }`;

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
          transactionCompletedLabel={'could not deposit and repay'}
          exit={onTransactionCompletedDismissed}
        />
      </StyledTransaction>
    );
  }

  return (
    <StyledTransaction onClose={onClose} header={header || t('components.transaction.repay.header')}>
      <TxPositionInput
        key={'credit-input'}
        headerText={t('components.transaction.borrow-credit.select-line')}
        inputText={t('components.transaction.borrow-credit.select-line')}
        onSelectedPositionChange={onSelectedPositionChange}
        selectedPosition={selectedPosition}
        positions={Object.values(positions)}
        // creditOptions={sourceCreditOptions}
        // inputError={!!sourceStatus.error}
        readOnly={false}
        // displayGuidance={displaySourceGuidance}
      />
      <TxDropdown
        key={'type-input'}
        headerText={t('components.transaction.repay.repay-type')}
        inputText={t('components.transaction.repay.select-repay-option')}
        onSelectedTypeChange={onSelectedTypeChange}
        selectedType={repayType}
        typeOptions={repaymentOptions}
        // creditOptions={sourceCreditOptions}
        // inputError={!!sourceStatus.error}
      />
      <TxTokenInput
        key={'token-input'}
        headerText={t('components.transaction.repay.select-amount')}
        inputText={tokenHeaderText}
        amount={targetAmount}
        onAmountChange={onAmountChange}
        // @cleanup TODO
        amountValue={String(10000000 * Number(targetAmount))}
        maxAmount={getMaxRepay()}
        selectedToken={selectedSellToken}
        onSelectedTokenChange={onSelectedSellTokenChange}
        // @cleanup TODO
        tokenOptions={walletNetwork === 'goerli' ? testTokens : sourceAssetOptions}
        // inputError={!!sourceStatus.error}
        readOnly={acceptingOffer}
        // displayGuidance={displaySourceGuidance}
      />
      <TxRateInput
        key={'frate'}
        headerText={t('components.transaction.repay.your-rates')}
        frate={selectedPosition.fRate}
        drate={selectedPosition.dRate}
        amount={selectedPosition.fRate}
        maxAmount={'100'}
        // setRateChange={onFrateChange}
        setRateChange={() => {}}
        readOnly={true}
      />
      <TxActions>
        {getActionsForRepayType(repayType).map(({ label, onAction, status, disabled, contrast }) => (
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
