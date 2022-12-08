import { FC, useState, useEffect } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';
import { ethers } from 'ethers';

import { formatAmount, normalizeAmount } from '@utils';
import {
  useAppTranslation,
  useAppDispatch,
  // used to dummy token for dev
  useAppSelector,
  useSelectedSellToken,
} from '@hooks';
import { ACTIVE_STATUS, ARBITER_POSITION_ROLE, BORROWER_POSITION_ROLE } from '@src/core/types';
import { getConstants } from '@src/config/constants';
import {
  TokensActions,
  WalletSelectors,
  LinesSelectors,
  CollateralSelectors,
  CollateralActions,
  LinesActions,
} from '@store';
import { Button } from '@components/common';

import { TxContainer } from './components/TxContainer';
import { TxTokenInput } from './components/TxTokenInput';
import { TxActionButton } from './components/TxActions';
import { TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';

const { ZERO_ADDRESS } = getConstants();

const StyledTransaction = styled(TxContainer)``;

interface AddCollateralTxProps {
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

//@ts-ignore
export const AddCollateralTx: FC<AddCollateralTxProps> = (props) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const history = useHistory();

  const userMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);

  //state for params
  const { header, onClose } = props;
  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const [transactionApproved, setTransactionApproved] = useState(true);
  const [transactionLoading, setLoading] = useState(false);
  const [targetTokenAmount, setTargetTokenAmount] = useState('1');
  const [errors, setErrors] = useState<string[]>([]);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);

  const setSelectedTokenAddress = (token: string) => dispatch(TokensActions.setSelectedTokenAddress);

  //main net logic
  const selectedCollateralAsset = useAppSelector(CollateralSelectors.selectSelectedCollateralToken);
  // const selectedTokenAddress = useAppSelector(TokensSelectors.selectToken);
  //const { selectedSellToken, sourceAssetOptions } = useSelectedSellToken({
  //  selectedSellTokenAddress: selectedCollateralAsset,
  //  allowTokenSelect: false,
  //});
  const selectedSellToken = {
    address: '0x3730954eC1b5c59246C1fA6a20dD6dE6Ef23aEa6',
    allowancesMap: {},
    balance: '0',
    balanceUsdc: '0',
    categories: ['Seerocoin'],
    decimals: 18,
    description: 'SeeroTestCoin',
    icon: 'https://raw.githack.com/yearn/yearn-assets/master/icons/mult…ns/1/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo-128.png',
    name: 'Serooocoin',
    priceUsdc: '0',
    symbol: 'SER',
    website: 'https://debtdao.finance/',
    // yield: '0',
  };

  console.log('slt', selectedCollateralAsset);
  console.log('sst', selectedSellToken);

  const enabledCollateralAddressess = _.values(selectedLine?.escrow?.deposits)?.map((d) => d.token.address);
  console.log(enabledCollateralAddressess, '23333');

  //const collateralOptions = sourceAssetOptions.filter(({ address }) =>
  //  _.includes(enabledCollateralAddressess, address)
  //);
  //console.log('col options', collateralOptions);
  console.log('add position tx useEffect token/creditLine', selectedSellToken, selectedLine, selectedCollateralAsset);

  useEffect(() => {
    console.log('add position tx useEffect token/creditLine', selectedSellToken, selectedLine);

    if (selectedLine && selectedLine.escrow?.deposits) {
      console.log('am here');
      const tokenAddress = Object.keys(selectedLine.escrow.deposits);
      console.log(tokenAddress);
      dispatch(CollateralActions.setSelectedCollateralAsset({ assetAddress: tokenAddress[0] }));
    }
    if (selectedCollateralAsset && !selectedSellToken) {
      console.log('setting select', selectedCollateralAsset);
      dispatch(
        TokensActions.setSelectedTokenAddress({
          tokenAddress: selectedCollateralAsset,
        })
      );
    }

    if (selectedSellToken) {
      setSelectedTokenAddress(selectedSellToken.address);
    }

    if (
      !selectedLine ||
      !selectedSellToken
      // toBN(targetTokenAmount).lte(0) ||
      // inputError ||
    ) {
      return;
    }
    // dispatch(CreditLineActions.getCreditLinesDynamicData({ addresses: [initialToken] })); // pulled from DepositTX, not sure why data not already filled
  }, [selectedSellToken, walletNetwork, selectedCollateralAsset]);

  const NavigateToDiscord = () => {
    console.log('discord');
    window.open('https://discord.gg/F83xx67fyQ', '_blank');
    onClose();
  };

  //if (collateralOptions.length < 0) {
  //  return (
  //    <StyledTransaction onClose={onClose} header={t('components.transaction.add-collateral.no-assets-enabled.title')}>
  //      <BadLineErrorContainer>
  //        <BadLineErrorBody>{t('components.transaction.add-collateral.no-assets-enabled.body')}</BadLineErrorBody>
  //        {userMetadata.role !== ARBITER_POSITION_ROLE ? (
  //          <StyledTxContainer>
  //            <StyledTxActionButton color="primary" onClick={NavigateToDiscord}>
  //              {t('components.transaction.add-collateral.no-assets-enabled.find-cta')}
  //            </StyledTxActionButton>
  //            <StyledSeperator />
  //            <StyledTxActionButton color="primary" onClick={onClose}>
  //              {t('components.transaction.add-collateral.no-assets-enabled.login-cta')}
  //            </StyledTxActionButton>
  //          </StyledTxContainer>
  //       ) : (
  //          <StyledTxActionButton color="primary" onClick={onClose}>
  //            {t('components.transaction.add-collateral.no-assets-enabled.enable-cta')}
  //          </StyledTxActionButton>
  //        )}
  //        <BadLineErrorImageContainer>
  //          <BadLineErrorImage />
  //        </BadLineErrorImageContainer>
  //     </BadLineErrorContainer>
  //    </StyledTransaction>
  //  );
  //}

  // Event Handlers
  const approveCollateralToken = () => {
    setLoading(true);
    if (!selectedLine?.escrow) {
      setLoading(false);
      return;
    }
    let approvalOBj = {
      tokenAddress: selectedCollateralAsset,
      amount: `${ethers.utils.parseEther(targetTokenAmount)}`,
      spenderAddress: selectedLine.escrow.id,
      network: walletNetwork,
    };
    console.log('approval obj', approvalOBj);
    //@ts-ignore
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

  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  const addCollateral = () => {
    setLoading(true);
    //TODO set error in state to display no line selected
    if (!selectedLine?.escrow || !selectedCollateralAsset || !targetTokenAmount) {
      console.log('check this', selectedLine?.id, targetTokenAmount, selectedCollateralAsset);
      setLoading(false);
      return;
    }

    console.log('escrow', selectedLine.escrow.id);

    const transactionData = {
      escrowAddress: selectedLine.escrow.id,
      amount: ethers.utils.parseEther(targetTokenAmount),
      token: selectedCollateralAsset,
      network: walletNetwork,
      dryRun: true,
    };
    //@ts-ignore
    dispatch(CollateralActions.addCollateral(transactionData)).then((res) => {
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

  const spigotCollateralSettings = [
    {
      label: t('components.transaction.enableSpigot'),
      onAction: addCollateral,
      status: true,
      disabled: transactionApproved,
      contrast: true,
    },
  ];

  const escrowCollateralSettings = [
    {
      label: t('components.transaction.approve'),
      onAction: approveCollateralToken,
      status: true,
      disabled: !transactionApproved,
      contrast: false,
    },
    {
      label: t('components.transaction.deposit'),
      onAction: addCollateral,
      status: true,
      disabled: transactionApproved,
      contrast: true,
    },
  ];
  const txActions = escrowCollateralSettings;
  //userMetadata.role === ARBITER_POSITION_ROLE
  //  ? spigotCollateralSettings
  //  : userMetadata.role === BORROWER_POSITION_ROLE
  // ? [...spigotCollateralSettings, ...escrowCollateralSettings]
  //  : escrowCollateralSettings;

  if (!selectedSellToken) {
    console.log('no select', selectedSellToken, selectedLine);
    return null;
  }

  if (!selectedLine) {
    console.log('no line', selectedLine);
    return null;
  }

  const targetBalance = normalizeAmount(selectedSellToken.balance, selectedSellToken.decimals);
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

  //const isActive = selectedLine.status === ACTIVE_STATUS;
  //console.log('s-ac', selectedLine.status, ACTIVE_STATUS);
  //if (!isActive) {
  //  const toMarketplace = () => {
  //    onClose();
  // send user to top of market page instead of bottom where they currently are
  //    window.scrollTo({ top: 0, left: 0 });
  //    history.push('/market');
  //  };
  //
  //  return (
  //    <StyledTransaction onClose={onClose} header={t('components.transaction.add-credit.bad-line.title')}>
  //      <BadLineErrorContainer>
  //        <BadLineErrorBody>{t('components.transaction.add-credit.bad-line.body')}</BadLineErrorBody>
  //        <StyledTxActionButton color="primary" onClick={toMarketplace}>
  //          {t('components.transaction.add-credit.back-to-market')}
  //        </StyledTxActionButton>
  //       <BadLineErrorImageContainer>
  //          <BadLineErrorImage />
  //        </BadLineErrorImageContainer>
  //      </BadLineErrorContainer>
  //    </StyledTransaction>
  //  );
  //}

  return (
    <StyledTransaction onClose={onClose} header={header || t('components.transaction.title')}>
      <TxTokenInput
        key={'token-input'}
        headerText={t('components.transaction.add-credit.select-token')}
        inputText={tokenHeaderText}
        amount={targetTokenAmount}
        amountValue={String(10000000 * Number(targetTokenAmount))}
        maxAmount={targetBalance}
        selectedToken={selectedSellToken}
        tokenOptions={[selectedSellToken]}
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
