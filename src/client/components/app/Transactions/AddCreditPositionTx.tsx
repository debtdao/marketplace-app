import { FC, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import { BigNumber } from 'ethers';
// import { parseUnits, hexlify } from 'ethers/lib/utils';

import { formatAmount, normalizeAmount, isAddress, toWei, addCreditUpdate } from '@utils';
import {
  useAppTranslation,
  useAppDispatch,
  // used to dummy token for dev
  useAppSelector,
  useSelectedSellToken,
} from '@hooks';
import { ACTIVE_STATUS, AddCreditProps, BORROWER_POSITION_ROLE, PROPOSED_STATUS } from '@src/core/types';
import { getConstants } from '@src/config/constants';
import {
  TokensActions,
  TokensSelectors,
  WalletSelectors,
  LinesSelectors,
  LinesActions,
  NetworkSelectors,
} from '@store';
import { Button } from '@components/common';

import { TxContainer } from './components/TxContainer';
import { TxTokenInput } from './components/TxTokenInput';
import { TxCreditLineInput } from './components/TxCreditLineInput';
import { TxRateInput } from './components/TxRateInput';
import { TxActionButton } from './components/TxActions';
import { TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';
import { TxAddressInput } from './components/TxAddressInput';
const {
  CONTRACT_ADDRESSES: { DAI },
  MAX_INTEREST_RATE,
} = getConstants();
const StyledTransaction = styled(TxContainer)``;

interface AddCreditPositionProps {
  header: string;
  onClose: () => void;
  acceptingOffer?: boolean;
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

export const AddCreditPositionTx: FC<AddCreditPositionProps> = (props) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const history = useHistory();

  //in case user is on Goerli Testnet, we set up a testnet state:
  const userMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const selectedPosition = useAppSelector(LinesSelectors.selectSelectedPosition);
  const walletAddress = useAppSelector(WalletSelectors.selectSelectedAddress);
  const selectedCredit = useAppSelector(LinesSelectors.selectSelectedLine);
  const setSelectedCredit = (lineAddress: string) => dispatch(LinesActions.setSelectedLineAddress({ lineAddress }));
  const selectedSellTokenAddress = useAppSelector(TokensSelectors.selectSelectedTokenAddress);
  const initialToken: string = selectedSellTokenAddress || DAI;
  console.log('add credit init tok', selectedPosition?.token.address, selectedSellTokenAddress, DAI);
  const { selectedSellToken, sourceAssetOptions } = useSelectedSellToken({
    selectedSellTokenAddress: initialToken,
    allowTokenSelect: true,
  });
  const positionToken = selectedPosition?.token ?? selectedSellToken;

  const acceptingOffer = props.acceptingOffer || (userMetadata.role === BORROWER_POSITION_ROLE && !!selectedPosition);

  //state for params
  const { header, onClose } = props;
  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const [transactionApproved, setTransactionApproved] = useState(true);
  const [transactionLoading, setLoading] = useState(false);
  const [targetTokenAmount, setTargetTokenAmount] = useState('0');
  const [drate, setDrate] = useState('');
  const [frate, setFrate] = useState('');
  const [lenderAddress, setLenderAddress] = useState(walletAddress ? walletAddress : '');
  const [selectedTokenAddress, setSelectedTokenAddress] = useState('');
  const [transactionType, setTransactionType] = useState('propose');
  const positions = useAppSelector(LinesSelectors.selectPositionsForSelectedLine);
  const currentNetwork = useAppSelector(NetworkSelectors.selectCurrentNetwork);

  console.log('selectedPosition', selectedPosition, selectedCredit);
  useEffect(() => {
    if (selectedPosition?.status === PROPOSED_STATUS) {
      //  selectedPosition.token.decimals instead of 0 as deci
      const deposit = normalizeAmount(selectedPosition.deposit, selectedPosition.token.decimals);
      console.log('position deposit user input vs norm val', selectedPosition.deposit, deposit);

      if (!targetTokenAmount) setTargetTokenAmount(deposit);
      if (!selectedSellTokenAddress) setSelectedTokenAddress(selectedPosition.token.address);
      if (!drate) setDrate(normalizeAmount(selectedPosition.dRate, 0));
      if (!frate) setFrate(normalizeAmount(selectedPosition.fRate, 0));
      setLenderAddress(selectedPosition.lender);
      setTargetTokenAmount(deposit);
      setTransactionType('accept');
    }
  }, [selectedPosition]);

  // if(1selectedSellToken || selectedSellToken?.address !== selectedPosition?.token.address) {
  //   setSelectedTokenAddress(selectedPosition?.token.address);
  //   dispatch(
  //     TokensActions.setSelectedTokenAddress({
  //       tokenAddress: selectedPosition?.token.address,
  //     });
  // }

  useEffect(() => {
    if (!selectedSellToken) {
      dispatch(
        TokensActions.setSelectedTokenAddress({
          tokenAddress: sourceAssetOptions[0].address,
        })
      );
    }
    if (!selectedTokenAddress && selectedSellToken) {
      setSelectedTokenAddress(selectedSellToken.address);
    }

    if (!selectedCredit || !selectedSellToken) {
      return;
    }
  }, [selectedSellToken, walletNetwork]);

  // Event Handlers

  const onLenderAddressChange = (lenderAddress: string) => {
    setLenderAddress(lenderAddress);
  };

  const onAmountChange = (amount: string): void => {
    setTargetTokenAmount(amount ?? '0');
  };

  const onRateChange = (type: string, amount: string): void => {
    if (type === 'd') setDrate(amount);
    if (type === 'f') setFrate(amount);
  };

  const onSelectedCreditLineChange = (addr: string): void => {
    setSelectedCredit(addr);
  };

  const onSelectedSellTokenChange = (tokenAddress: string) => {
    dispatch(TokensActions.setSelectedTokenAddress({ tokenAddress }));
  };

  const approveToken = () => {
    setLoading(true);
    if (!selectedCredit?.id) {
      setLoading(false);
      return;
    }

    let approvalOBj = {
      tokenAddress: selectedSellToken!.address,
      amount: toWei(targetTokenAmount, selectedSellToken!.decimals),
      lineAddress: selectedCredit.id,
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

  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  const addCreditPosition = async () => {
    setLoading(true);
    console.log('add position ', selectedCredit?.id, positionToken?.address);
    // TODO set error in state to display no line selected
    if (!selectedCredit?.id || !drate || !frate || lenderAddress === '' || !positions) {
      setLoading(false);
      return;
    }

    let checkSumAddress = await isAddress(lenderAddress);

    if (!checkSumAddress) {
      return;
    }

    if (!positionToken) {
      return;
    }

    const amountInWei = toWei(targetTokenAmount, positionToken!.decimals);

    const transactionObj: AddCreditProps = {
      lineAddress: selectedCredit.id,
      drate: BigNumber.from(drate),
      frate: BigNumber.from(frate),
      amount: BigNumber.from(amountInWei),
      token: positionToken.address,
      lender: lenderAddress,
      network: walletNetwork!,
      dryRun: false,
    };

    dispatch(LinesActions.addCredit(transactionObj)).then((res) => {
      if (res.meta.requestStatus === 'rejected') {
        setTransactionApproved(transactionApproved);
        setLoading(false);
      }
      if (res.meta.requestStatus === 'fulfilled' && transactionType === 'accept') {
        if (!selectedPosition) {
          return;
        }
        const updatedPosition = addCreditUpdate(selectedPosition);
        dispatch(
          LinesActions.setPosition({
            id: selectedPosition.id,
            position: selectedPosition,
          })
        );
        setTransactionCompleted(1);
        setLoading(false);
      }
      if (res.meta.requestStatus === 'fulfilled' && transactionType === 'propose') {
        setTransactionCompleted(1);
        setLoading(false);
      }
    });
  };

  const txActions =
    userMetadata.role === BORROWER_POSITION_ROLE
      ? [
          {
            label: t('components.transaction.accept'),
            onAction: addCreditPosition,
            status: true,
            disabled: !transactionApproved,
            contrast: true,
          },
        ]
      : [
          {
            label: t('components.transaction.approve'),
            onAction: approveToken,
            status: true,
            disabled: !transactionApproved,
            contrast: false,
          },
          {
            label: t('components.transaction.deposit'),
            onAction: addCreditPosition,
            status: true,
            disabled: transactionApproved,
            contrast: true,
          },
        ];

  console.log('add cred sellToken', selectedPosition, positionToken, selectedSellToken);
  if (!positionToken) return null;
  if (!selectedCredit) return null;

  const targetBalance = normalizeAmount(positionToken.balance, positionToken.decimals);
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

  // TODO: When should propspective lenders not be able to propose a position for a a Line of Credit?
  const isActive = selectedCredit.status === ACTIVE_STATUS;
  if (!isActive) {
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
    <StyledTransaction
      onClose={onClose}
      header={acceptingOffer ? t('components.transaction.add-credit.header-accepting') : header}
    >
      <TxCreditLineInput
        key={'borrower-input'}
        headerText={t('components.transaction.add-credit.select-credit')}
        inputText={t('components.transaction.add-credit.select-credit')}
        onSelectedCreditLineChange={onSelectedCreditLineChange}
        selectedCredit={selectedCredit}
        readOnly={true}
      />

      <TxTokenInput
        key={'token-input'}
        headerText={t('components.transaction.add-credit.select-token')}
        inputText={tokenHeaderText}
        amount={targetTokenAmount}
        onAmountChange={onAmountChange}
        amountValue={toWei(targetTokenAmount, positionToken.decimals)}
        maxAmount={acceptingOffer ? targetTokenAmount : targetBalance}
        selectedToken={positionToken}
        onSelectedTokenChange={onSelectedSellTokenChange}
        tokenOptions={acceptingOffer ? [] : sourceAssetOptions}
        readOnly={acceptingOffer}
      />

      <TxAddressInput
        key={'lender-input'}
        headerText={t('components.transaction.add-credit.select-lender')}
        inputText={t('components.transaction.add-credit.lender-address')}
        onAddressChange={onLenderAddressChange}
        address={lenderAddress}
        readOnly={acceptingOffer}
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
