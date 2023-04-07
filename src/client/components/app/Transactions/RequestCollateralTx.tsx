import { FC, useState, useEffect } from 'react';
import { BigNumber } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import styled from 'styled-components';
import _ from 'lodash';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import { formatAmount, humanize, normalizeAmount, toUnit, toWei } from '@utils';
import {
  useAppTranslation,
  useAppDispatch,
  // used to dummy token for dev
  useAppSelector,
  useSelectedSellToken,
} from '@hooks';
import { ACTIVE_STATUS, ARBITER_POSITION_ROLE, BORROWER_POSITION_ROLE } from '@src/core/types';
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

const StyledTransaction = styled(TxContainer)`
  min-height: 50rem;
`;
interface RequestCollateralTxProps {
  header: string;
  onClose: () => void;
}

interface LineRouteParams {
  network: string;
  line: string;
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

export const RequestCollateralTx: FC<RequestCollateralTxProps> = (props) => {
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
  const collateralOptionsList = useAppSelector(selectDepositTokenOptionsByAsset)();
  const collateralOptions = collateralOptionsList.reduce((agg: any, option) => {
    agg[option.address] = option;
    return agg;
  }, {});

  const selectedCollateralAssetAddress =
    useAppSelector(CollateralSelectors.selectSelectedCollateralAsset)?.address ?? '';
  const selectedCollateralAsset = collateralOptions[selectedCollateralAssetAddress];

  useEffect(() => {
    if (!selectedCollateralAsset && collateralOptionsList.length > 0) {
      dispatch(
        CollateralActions.setSelectedCollateralAsset({
          assetAddress: collateralOptionsList[0].address,
        })
      );
    }
  }, [selectedCollateralAsset, collateralOptionsList]);

  const openTwitterPrompt = () => {
    if (!selectedCollateralAsset || !selectedLine) {
      onClose();
    }

    // only outputting localhost:3000 on testing, see if persists with real urls
    // const targetLineUrl = window.location.href;
    const tweetText = `Requesting $${selectedCollateralAsset.symbol} to be approved as collateral for my line ${selectedLine?.id} on ${currentNetwork}.                                                                      
                       Thanks @debtdao 🙏💧`;
    const twitterPrompt = `https://twitter.com/intent/tweet?text=${tweetText}&related=debtdao,kibagateaux`;
    window.open(twitterPrompt, '_blank');
    onClose();
  };

  // TODO add edgecase UIs., Copied over from Add Collat
  // if (collateralOptionsList.length === 0) {
  //   return (
  //     <StyledTransaction onClose={onClose} header={t('components.transaction.add-collateral.no-assets-enabled.title')}>
  //       <BadLineErrorContainer>
  //         <BadLineErrorBody>{t('components.transaction.add-collateral.no-assets-enabled.body')}</BadLineErrorBody>
  //         {userMetadata.role === BORROWER_POSITION_ROLE ? (
  //           <StyledTxContainer>
  //             <StyledTxActionButton color="primary" onClick={openTwitterPrompt}>
  //               {t('components.transaction.request-collateral.no-assets-enabled.find-cta')}
  //             </StyledTxActionButton>
  //             <StyledSeperator />
  //             <StyledTxActionButton color="primary" onClick={onClose}>
  //               {t('components.transaction.request-collateral.no-assets-enabled.login-cta')}
  //             </StyledTxActionButton>
  //           </StyledTxContainer>
  //         ) : (
  //           <StyledTxActionButton color="primary" onClick={onClose}>
  //             {t('components.transaction.request-collateral.no-assets-enabled.enable-cta')}
  //           </StyledTxActionButton>
  //         )}
  //         <BadLineErrorImageContainer>
  //           <BadLineErrorImage />
  //         </BadLineErrorImageContainer>
  //       </BadLineErrorContainer>
  //     </StyledTransaction>
  //   );
  // }

  // const isActive = selectedLine.status === ACTIVE_STATUS;
  // if (!isActive) {
  //   const toMarketplace = () => {
  //     onClose();
  //     // send user to top of market page instead of bottom where they currently are
  //     window.scrollTo({ top: 0, left: 0 });
  //     history.push(`${currentNetwork}/market`);
  //   };

  //   return (
  //     <StyledTransaction onClose={onClose} header={t('components.transaction.add-credit.bad-line.title')}>
  //       <BadLineErrorContainer>
  //         <BadLineErrorBody>{t('components.transaction.add-credit.bad-line.body')}</BadLineErrorBody>
  //         <StyledTxActionButton color="primary" onClick={toMarketplace}>
  //           {t('components.transaction.add-credit.back-to-market')}
  //         </StyledTxActionButton>
  //         <BadLineErrorImageContainer>
  //           <BadLineErrorImage />
  //         </BadLineErrorImageContainer>
  //       </BadLineErrorContainer>
  //     </StyledTransaction>
  //   );
  // }

  if (!selectedLine) return null;
  if (!selectedCollateralAsset) return null;

  const targetBalance = normalizeAmount(selectedCollateralAsset.balance, selectedCollateralAsset.decimals);
  const tokenHeaderText = `${t('components.transaction.token-input.you-have')} ${formatAmount(targetBalance, 4)}`;

  const requestCollateralActions = [
    {
      label: t('components.transaction.request-collateral.cta'),
      onAction: openTwitterPrompt,
      status: true,
      disabled: !transactionApproved,
      contrast: false,
    },
  ];

  const txActions = userMetadata.role === BORROWER_POSITION_ROLE ? requestCollateralActions : [];

  return (
    <StyledTransaction onClose={onClose} header={t('components.transaction.request-collateral.header')}>
      <TxTokenInput
        key={'request-collateral-token-input'}
        style="oracle"
        readOnly
        headerText={t('components.transaction.request-collateral.token-input-header')}
        inputText={t('components.transaction.oracle-price')}
        // inputText={tokenHeaderText}
        amountValue={toUnit(selectedCollateralAsset.priceUsdc, 6)}
        selectedToken={selectedCollateralAsset}
        tokenOptions={collateralOptionsList}
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
