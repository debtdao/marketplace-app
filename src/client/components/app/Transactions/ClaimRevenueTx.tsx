import { FC, useState, useEffect } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';

import { formatAmount, normalizeAmount } from '@utils';
import {
  useAppTranslation,
  useAppDispatch,

  // used to dummy token for dev
  useAppSelector,
  useSelectedSellToken,
} from '@hooks';
import { getConstants } from '@src/config/constants';
import {
  TokensActions,
  TokensSelectors,
  VaultsSelectors,
  LinesSelectors,
  LinesActions,
  CollateralSelectors,
  CollateralActions,
  WalletSelectors,
} from '@store';

import { TxContainer } from './components/TxContainer';
import { TxTokenInput } from './components/TxTokenInput';
import { TxCreditLineInput } from './components/TxCreditLineInput';
import { TxActionButton, TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';

const {
  CONTRACT_ADDRESSES: { ETH },
} = getConstants();
const StyledTransaction = styled(TxContainer)``;

interface LiquidateBorrowerProps {
  header: string;
  onClose: () => void;
  onSelectedCreditLineChange: Function;
  allowVaultSelect: boolean;
  onPositionChange: (data: { credit?: string; token?: string; amount?: string }) => void;
}

export const LiquidateBorrowerTx: FC<LiquidateBorrowerProps> = (props) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const { header, onClose, onPositionChange } = props;

  const [targetTokenAmount, setTargetTokenAmount] = useState('10000000');
  const selectedSpigot = useAppSelector(CollateralSelectors.selectSelectedSpigot);
  const selectedRevenueContract = useAppSelector(CollateralSelectors.selectSelectedRevenueContractAddress);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const [claimData, setClaimData] = useState('');

  const [transactionLoading, setLoading] = useState(false);
  const [selectedTokenAddress, setSelectedTokenAddress] = useState('');
  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const selectedSellTokenAddress = useAppSelector(TokensSelectors.selectSelectedTokenAddress);
  const initialToken: string = selectedSellTokenAddress || ETH;

  const { selectedSellToken, sourceAssetOptions } = useSelectedSellToken({
    selectedSellTokenAddress: initialToken,
    allowTokenSelect: true,
  });

  useEffect(() => {
    if (selectedTokenAddress === '' && selectedSellToken) {
      setSelectedTokenAddress(selectedSellToken.address);
    }
    if (!selectedSellToken) {
      dispatch(
        TokensActions.setSelectedTokenAddress({
          tokenAddress: sourceAssetOptions[0].address,
        })
      );
    }

    if (
      !selectedSpigot ||
      !selectedSellToken
      // toBN(targetTokenAmount).lte(0) ||
      // inputError ||
    ) {
      return;
    }

    dispatch(TokensActions.getTokensDynamicData({ addresses: [initialToken] })); // pulled from DepositTX, not sure why data not already filled
    // dispatch(CreditLineActions.getCreditLinesDynamicData({ addresses: [initialToken] })); // pulled from DepositTX, not sure why data not already filled
  }, []);

  const _updatePosition = () =>
    onPositionChange({
      credit: selectedSpigot?.id,
      token: selectedSellToken?.address,
      amount: targetTokenAmount,
    });

  const onSelectedSellTokenChange = (tokenAddress: string) => {
    setTargetTokenAmount('');
    dispatch(TokensActions.setSelectedTokenAddress({ tokenAddress }));
  };

  // Event Handlers

  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  if (!selectedSellToken) return null;
  if (!selectedSpigot) return null;

  const targetBalance = normalizeAmount(selectedSellToken.balance, selectedSellToken.decimals);
  const tokenHeaderText = `${t('components.transaction.token-input.you-have')} ${formatAmount(targetBalance, 4)} ${
    selectedSellToken.symbol
  }`;

  const claimRevenue = () => {
    if (!selectedSpigot.id) {
      console.log('claim rev modal: claimRevenue() - no spigot selected');
      return;
    }

    if (!selectedRevenueContract) {
      console.log('claim rev modal: claimRevenue() - no rev contract selected');
      return;
    }

    dispatch(
      CollateralActions.claimRevenue({
        spigotAddress: selectedSpigot.id,
        revenueContract: selectedRevenueContract,
        claimData: claimData,
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

  return (
    <StyledTransaction onClose={onClose} header={header || t('components.transaction.title')}>
      <TxActions>
        <TxActionButton
          data-testid={`modal-action-claim-revenue`}
          onClick={claimRevenue}
          disabled={false}
          contrast={true}
          isLoading={transactionLoading}
        >
          {t('')}
        </TxActionButton>
      </TxActions>
    </StyledTransaction>
  );
};
