import _ from 'lodash';
import styled from 'styled-components';
import { BigNumber, BytesLike, ethers } from 'ethers';
import { FC, useState, useEffect } from 'react';
import { getAddress } from '@ethersproject/address';

import {
  formatAmount,
  normalizeAmount,
  toWei,
  depositAndRepayUpdate,
  normalize,
  bn,
  getTradeQuote,
  isGoerli,
} from '@utils';
import { useAppTranslation, useAppDispatch, useAppSelector, useSelectedSellToken } from '@hooks';
import {
  TokensActions,
  TokensSelectors,
  createToken,
  VaultsSelectors,
  LinesSelectors,
  LinesActions,
  WalletSelectors,
  CollateralActions,
  CollateralSelectors,
} from '@store';
import { getConstants, testTokens } from '@src/config/constants';
import {
  Balance,
  CreditPosition,
  RevenueSummary,
  TokenView,
  ZeroExAPIQuoteResponse,
  ClaimOperatorTokensProps,
} from '@src/core/types';

import { TxContainer } from './components/TxContainer';
import { TxTokenInput } from './components/TxTokenInput';
import { TxActionButton } from './components/TxActions';
import { TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';

const StyledTransaction = styled(TxContainer)`
  height: 100%;
`;

interface ClaimOperatorTokensTxProps {
  header: string;
  onClose: () => void;
}

const {
  CONTRACT_ADDRESSES: { DAI, ETH },
} = getConstants();

export const ClaimOperatorTokensTx: FC<ClaimOperatorTokensTxProps> = (props) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const { header, onClose } = props;

  const selectedPosition = useAppSelector(LinesSelectors.selectSelectedPosition);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  const selectedSpigot = useAppSelector(CollateralSelectors.selectSelectedSpigot);
  const reservesMap = useAppSelector(CollateralSelectors.selectReservesMap);
  const tokensMap = useAppSelector(TokensSelectors.selectTokensMap);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const selectedSellTokenAddress = useAppSelector(TokensSelectors.selectSelectedTokenAddress);
  const initialToken: string = selectedSellTokenAddress ?? selectedPosition?.token.address ?? DAI;

  // @cleanup TODO only use sell token for claimAndRepay/Trade. use selectedPosition.token for everything else
  const { selectedSellToken, sourceAssetOptions } = useSelectedSellToken({
    selectedSellTokenAddress: initialToken,
    // selectedVaultOrLab: useAppSelector(VaultsSelectors.selectRecommendations)[0],
    allowTokenSelect: true,
  });

  // used for 0x testing
  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const [transactionLoading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>(['']);
  const [transactionApproved, setTransactionApproved] = useState(true);
  const [targetAmount, setTargetAmount] = useState('0');
  const [selectedTokenAddress, setSelectedTokenAddress] = useState('');
  const [claimableTokenAddresses, setClaimableTokenAddresses] = useState(['']);
  const [reservesPopulated, setReservesPopulated] = useState(false);

  useEffect(() => {
    // populate collateral reservesmap in redux state
    // get all collateral tokens of type revenue
    const lineRevenueSummary = selectedSpigot!.revenueSummary;
    const revenueCollateralTokens: RevenueSummary[] = Object.values(lineRevenueSummary).filter(
      (token) => token.type === 'revenue'
    );
    // populate reserves map with each revenue collateral token
    for (const token of revenueCollateralTokens as RevenueSummary[]) {
      dispatch(
        CollateralActions.tradeable({
          lineAddress: getAddress(selectedLine!.id),
          spigotAddress: getAddress(selectedLine!.spigotId),
          tokenAddress: getAddress(token.token.address),
          network: walletNetwork!,
        })
      );
    }
    setReservesPopulated(true);
  }, []);

  useEffect(() => {
    if (Object.keys(reservesMap).length !== 0 || !reservesPopulated) {
      const reservesTokenAddresses = reservesMap[getAddress(selectedLine!.id)]
        ? Object.keys(reservesMap[getAddress(selectedLine!.id)])
        : [];
      dispatch(
        TokensActions.setSelectedTokenAddress({
          tokenAddress: reservesTokenAddresses[0],
        })
      );
      setClaimableTokenAddresses(reservesTokenAddresses);
    } else {
      dispatch(
        TokensActions.setSelectedTokenAddress({
          tokenAddress: sourceAssetOptions[0].address,
        })
      );
    }
    if (!selectedTokenAddress && selectedSellToken) {
      setSelectedTokenAddress(selectedSellToken.address);
    }
  }, [reservesMap]);

  const claimableTokenOptions: TokenView[] = claimableTokenAddresses.map((address) => {
    const isThisGoerli = isGoerli(walletNetwork);
    if (isThisGoerli) {
      return testTokens.find((token) => token.address === address)!;
    } else {
      const tokenData = tokensMap[address];
      const userTokenData = {} as Balance;
      const allowancesMap = {};
      return createToken({ tokenData, userTokenData, allowancesMap });
    }
  });

  // Event Handlers
  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  const claimOperatorTokens = () => {
    setLoading(true);
    if (!selectedLine || !selectedSellTokenAddress) {
      return;
    }
    const transactionData: ClaimOperatorTokensProps = {
      spigotAddress: getAddress(selectedLine?.spigotId),
      token: getAddress(selectedSellTokenAddress),
      network: walletNetwork,
    };

    dispatch(CollateralActions.claimOperatorTokens(transactionData)).then((res) => {
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

  if (!selectedLine) return null;
  if (!selectedSellToken) return null;

  const onSelectedSellTokenChange = (tokenAddress: string) => {
    dispatch(TokensActions.setSelectedTokenAddress({ tokenAddress }));
  };

  if (transactionCompleted === 1) {
    return (
      <StyledTransaction onClose={onClose} header={t('components.transaction.header')}>
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
      <StyledTransaction onClose={onClose} header={t('components.transaction.header')}>
        <TxStatus
          success={transactionCompleted}
          transactionCompletedLabel={t('components.transaction.claim-revenue.claim-operator-tokens.error-message')}
          exit={onTransactionCompletedDismissed}
        />
      </StyledTransaction>
    );
  }

  const claimTargetBalance = normalizeAmount(
    reservesMap[getAddress(selectedLine.id)] && reservesMap[getAddress(selectedLine.id)][selectedSellToken.address]
      ? reservesMap[getAddress(selectedLine.id)][selectedSellToken.address].operatorTokens
      : '0',
    selectedSellToken.decimals
  );

  const claimTokenHeaderText = `${t('components.transaction.token-input.you-have')} ${formatAmount(
    claimTargetBalance,
    4
  )} ${selectedSellToken.symbol}`;

  const renderInputComponents = () => {
    return (
      <>
        <TxTokenInput
          headerText={t('components.transaction.repay.claim-and-repay.claim-token')}
          inputText={claimTokenHeaderText}
          amount={claimTargetBalance}
          onAmountChange={(amnt) => setTargetAmount(amnt)}
          selectedToken={selectedSellToken}
          onSelectedTokenChange={onSelectedSellTokenChange}
          tokenOptions={claimableTokenOptions}
          readOnly={true}
        />
      </>
    );
  };

  return (
    <StyledTransaction onClose={onClose} header={header || t('components.transaction.claim-revenue.header')}>
      {renderInputComponents()}
      <TxActions>
        <TxActionButton
          key={''}
          data-testid={`modal-action-${t(
            'components.transaction.claim-revenue.claim-operator-tokens.cta'
          ).toLowerCase()}`}
          onClick={claimOperatorTokens}
          disabled={claimTargetBalance === '0'}
          contrast={false}
          isLoading={transactionLoading}
        >
          {t('components.transaction.claim-revenue.claim-operator-tokens.cta')}
        </TxActionButton>
      </TxActions>
    </StyledTransaction>
  );
};
