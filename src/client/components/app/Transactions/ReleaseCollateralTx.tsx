import { FC, useState, useEffect } from 'react';
import { BigNumber } from 'ethers';
import styled from 'styled-components';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';

import { formatAmount, normalizeAmount, toUnit, toWei } from '@utils';
import {
  useAppTranslation,
  useAppDispatch,
  // used to dummy token for dev
  useAppSelector,
  useSelectedSellToken,
} from '@hooks';
import {
  ACTIVE_STATUS,
  ARBITER_POSITION_ROLE,
  BORROWER_POSITION_ROLE,
  ReleaseCollateraltProps,
  REPAID_STATUS,
} from '@src/core/types';
import { getConstants, testTokens } from '@src/config/constants';
import {
  TokensActions,
  WalletSelectors,
  LinesSelectors,
  CollateralSelectors,
  CollateralActions,
  LinesActions,
  selectDepositTokenOptionsByAsset,
  ModalSelectors,
  NetworkSelectors,
} from '@store';
import { Button } from '@components/common';

import { TxContainer } from './components/TxContainer';
import { TxTokenInput } from './components/TxTokenInput';
import { TxActionButton } from './components/TxActions';
import { TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';

const { ZERO_ADDRESS } = getConstants();

const StyledTransaction = styled(TxContainer)``;
interface ReleaseCollateralTxProps {
  header: string;
  onClose: () => void;
}

const BadLineErrorContainer = styled.div``;

const BadLineErrorBody = styled.h3`
  ${({ theme }) => `
    margin: ${theme.spacing.lg} 0;
    font-size: ${theme.fonts.sizes.md};;
  `}
`;

const BadLineErrorImageContainer = styled.div``;

const BadLineErrorImage = styled.img``;

const StyledTxActionButton = styled(Button)<{ color?: string; contrast?: boolean }>`
  height: 4rem;
  flex: 1;
  font-size: 1.6rem;
  font-weight: 700;
  gap: 0.5rem;
  background-color: ${({ theme }) => theme.colors.txModalColors.primary};
  color: ${({ theme }) => theme.colors.txModalColors.onPrimary};
`;

const StyledTxContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
`;

const StyledSeperator = styled.div`
  width: 20px;
`;

export const ReleaseCollateralTx: FC<ReleaseCollateralTxProps> = (props) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const history = useHistory();

  const userMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const currentNetwork = useAppSelector(NetworkSelectors.selectCurrentNetwork);

  //state for params
  const { header, onClose } = props;
  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const [transactionApproved, setTransactionApproved] = useState(true);
  const [transactionLoading, setLoading] = useState(false);
  const [targetTokenAmount, setTargetTokenAmount] = useState('0');
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  const selectedLineAddress = useAppSelector(LinesSelectors.selectSelectedLineAddress);
  const linesMap = useAppSelector(LinesSelectors.selectLinesMap);
  const borrower = linesMap[selectedLineAddress!].borrower;
  const selectedEscrow = useAppSelector(CollateralSelectors.selectSelectedEscrow);
  const allCollateralOptions = useAppSelector(selectDepositTokenOptionsByAsset)();

  const { assetAddress: selectedCollateralAssetAddress } = useAppSelector(ModalSelectors.selectActiveModalProps);
  const collateralOptions = _.values(selectedEscrow?.deposits).map((d) => d.token);
  const selectedCollateralAsset = selectedCollateralAssetAddress
    ? selectedEscrow?.deposits![selectedCollateralAssetAddress].token
    : undefined;

  useEffect(() => {
    if (!selectedEscrow && selectedLine?.escrowId) {
      console.log('set selected escrow', selectedLine.escrowId);
      dispatch(CollateralActions.setSelectedEscrow({ escrowAddress: selectedLine.escrowId }));
    }
  }, [selectedEscrow, selectedLine]);

  useEffect(() => {
    if (!selectedCollateralAsset && collateralOptions.length > 0) {
      console.log('set collat asset', selectedCollateralAsset, collateralOptions[0].address);
      dispatch(
        CollateralActions.setSelectedCollateralAsset({
          assetAddress: collateralOptions[0].address,
        })
      );
    }
  }, [selectedCollateralAsset, collateralOptions]);

  const NavigateToDiscord = () => {
    window.open('https://discord.com/channels/964777235896746024/1054810838818635888/1054811038803054602', '_blank');
    onClose();
  };

  console.log('no collat to render?', collateralOptions.length === 0);
  if (collateralOptions.length === 0) {
    return (
      <StyledTransaction onClose={onClose} header={t('components.transaction.release-collateral.header')}>
        <BadLineErrorContainer>
          <BadLineErrorBody>{t('components.transaction.add-collateral.no-assets-enabled.body')}</BadLineErrorBody>
          {userMetadata.role !== ARBITER_POSITION_ROLE ? (
            <StyledTxContainer>
              <StyledTxActionButton color="primary" onClick={NavigateToDiscord}>
                {t('components.transaction.add-collateral.no-assets-enabled.find-cta')}
              </StyledTxActionButton>
              <StyledSeperator />
              <StyledTxActionButton color="primary" onClick={onClose}>
                {t('components.transaction.add-collateral.no-assets-enabled.login-cta')}
              </StyledTxActionButton>
            </StyledTxContainer>
          ) : (
            <StyledTxActionButton color="primary" onClick={onClose}>
              {t('components.transaction.add-collateral.no-assets-enabled.enable-cta')}
            </StyledTxActionButton>
          )}
          <BadLineErrorImageContainer>
            <BadLineErrorImage />
          </BadLineErrorImageContainer>
        </BadLineErrorContainer>
      </StyledTransaction>
    );
  }

  // Event Handler

  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  const releaseCollateral = () => {
    setLoading(true);
    // TODO set error in state to display no line selected
    if (!selectedEscrow || !selectedCollateralAsset || !targetTokenAmount) {
      console.log('check this', selectedLine?.id, targetTokenAmount, selectedCollateralAsset);
      setLoading(false);
      return;
    }
    const amount = BigNumber.from(targetTokenAmount).mul(BigNumber.from(10).pow(selectedCollateralAsset.decimals));
    console.log(
      'add collateral',
      targetTokenAmount,
      toUnit(targetTokenAmount, Number(selectedCollateralAsset.decimals)),
      amount
    );

    const transactionData: ReleaseCollateraltProps = {
      to: borrower,
      escrowAddress: selectedEscrow.id,
      amount,
      token: selectedCollateralAsset.address,
      network: walletNetwork,
    };

    dispatch(CollateralActions.releaseCollateral(transactionData)).then((res) => {
      if (res.meta.requestStatus === 'rejected') {
        setTransactionCompleted(2);
        console.log(transactionCompleted, 'tester');
        setLoading(false);
      }
      if (res.meta.requestStatus === 'fulfilled') {
        setTransactionCompleted(1);
        console.log(transactionCompleted, 'tester');
        setLoading(false);
      }
    });
  };

  const escrowCollateralSettings = [
    {
      label: t('components.transaction.release'),
      onAction: releaseCollateral,
      status: true,
      disabled: transactionApproved,
      contrast: true,
    },
  ];
  const txActions = userMetadata.role === BORROWER_POSITION_ROLE ? escrowCollateralSettings : [];

  console.log('selected collat', selectedCollateralAsset);
  if (!selectedCollateralAsset) return null;
  const tokenView = _.find(allCollateralOptions, (t) => t.address === selectedCollateralAsset.address);
  console.log('add collat', tokenView);
  if (!tokenView) return null;
  if (!selectedLine) return null;

  const targetBalance = normalizeAmount(tokenView.balance, tokenView.decimals);
  const tokenHeaderText = `${t('components.transaction.token-input.you-have')} ${formatAmount(targetBalance, 4)}`;

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

  const isActive = selectedLine.status === ACTIVE_STATUS || selectedLine.status === REPAID_STATUS;
  if (!isActive) {
    console.log(isActive);
    console.log(selectedLine.status);
    const toMarketplace = () => {
      onClose();
      // send user to top of market page instead of bottom where they currently are
      window.scrollTo({ top: 0, left: 0 });
      history.push(`${currentNetwork}/market`);
    };

    return (
      <StyledTransaction onClose={onClose} header={t('components.transaction.add-credit.bad-line.title')}>
        <BadLineErrorContainer>
          <BadLineErrorBody>{t('components.transaction.add-credit.bad-line.body')}</BadLineErrorBody>
          <StyledTxActionButton color="primary" onClick={toMarketplace}>
            {t('components.transaction.add-credit.back-to-market')}
          </StyledTxActionButton>
          <BadLineErrorImageContainer>
            <BadLineErrorImage />
          </BadLineErrorImageContainer>
        </BadLineErrorContainer>
      </StyledTransaction>
    );
  }

  return (
    <StyledTransaction onClose={onClose} header={t('components.transaction.release-collateral.header')}>
      <TxTokenInput
        key={'token-input'}
        headerText={t('components.transaction.release-collateral.select-token')}
        inputText={tokenHeaderText}
        amount={targetTokenAmount}
        amountValue={String(10000000 * Number(targetTokenAmount))}
        maxAmount={targetBalance}
        onAmountChange={setTargetTokenAmount}
        selectedToken={selectedCollateralAsset}
        tokenOptions={collateralOptions}
        // inputError={!!sourceStatus.error}
        // displayGuidance={displaySourceGuidance}
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
