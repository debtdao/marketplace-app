import _ from 'lodash';
import styled from 'styled-components';
import { BigNumber, ethers } from 'ethers';
import { FC, useState, useEffect } from 'react';
import { getAddress } from '@ethersproject/address';

import { formatAmount, normalizeAmount, toWei, depositAndRepayUpdate, normalize, bn, getTradeQuote } from '@utils';
import { useAppTranslation, useAppDispatch, useAppSelector, useSelectedSellToken } from '@hooks';
import { TokensActions, TokensSelectors, VaultsSelectors, LinesSelectors, LinesActions, WalletSelectors } from '@store';
import { getConstants, testTokens } from '@src/config/constants';
import { CreditPosition, TokenView, ZeroExAPIQuoteResponse } from '@src/core/types';

import { TxContainer } from './components/TxContainer';
import { TxTokenInput } from './components/TxTokenInput';
import { TxActionButton } from './components/TxActions';
import { TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';
import { TxRateInput } from './components/TxRateInput';
import { TxDropdown } from './components/TxDropdown';
import { TxPositionInput } from './components/TxPositionInput';

const StyledTransaction = styled(TxContainer)``;
const TradeError = styled.h3`
  color: red;
  font-weight: 800;
`;

interface RepayPositionProps {
  header: string;
  onClose: () => void;
  acceptingOffer: boolean;
  onSelectedCreditLineChange: Function;
  onPositionChange: (data: { credit?: string; token: string | undefined; amount?: string }) => void;
}

const {
  CONTRACT_ADDRESSES: { DAI, ETH },
} = getConstants();

export const RepayPositionTx: FC<RepayPositionProps> = (props) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const { acceptingOffer, header, onClose, onPositionChange } = props;
  const allRepaymentOptions = [
    {
      id: 'deposit-and-repay',
      label: t('components.transaction.repay.deposit-and-repay.title'),
      value: t('components.transaction.repay.deposit-and-repay.desc'),
    },
    {
      id: 'deposit-and-close',
      label: t('components.transaction.repay.deposit-and-close.title'),
      value: t('components.transaction.repay.deposit-and-close.desc'),
    },
    {
      id: 'unused',
      label: t('components.transaction.repay.unused.title'),
      value: t('components.transaction.repay.unused.desc'),
    },
    {
      id: 'close',
      label: t('components.transaction.repay.close.title'),
      value: t('components.transaction.repay.close.desc'),
    },
    {
      id: 'claim-and-repay',
      label: t('components.transaction.repay.claim-and-repay.title'),
      value: t('components.transaction.repay.claim-and-repay.desc'),
    },
    {
      id: 'claim-and-trade',
      label: t('components.transaction.repay.claim-and-trade.title'),
      value: t('components.transaction.repay.claim-and-trade.desc'),
    },
  ];

  const [repayType, setRepayType] = useState(allRepaymentOptions[0]);
  const selectedPosition = useAppSelector(LinesSelectors.selectSelectedPosition);
  const userMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const positions = useAppSelector(LinesSelectors.selectPositionsForSelectedLine);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const selectedSellTokenAddress = useAppSelector(TokensSelectors.selectSelectedTokenAddress);
  const initialToken: string = selectedSellTokenAddress ?? selectedPosition?.token.address ?? DAI;

  // @cleanup TODO only use sell token for claimAndRepay/Trade. use selectedPosition.token for everything else
  const { selectedSellToken, sourceAssetOptions } = useSelectedSellToken({
    selectedSellTokenAddress: initialToken,
    selectedVaultOrLab: useAppSelector(VaultsSelectors.selectRecommendations)[0],
    allowTokenSelect: true,
  });

  // used for 0x testing
  const tokensMap = useAppSelector(TokensSelectors.selectTokensMap);

  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const [transactionLoading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>(['']);
  const [transactionApproved, setTransactionApproved] = useState(true);
  const [targetAmount, setTargetAmount] = useState('100000000000');

  const [selectedTokenAddress, setSelectedTokenAddress] = useState('');
  const [tokensToBuy, setTokensToBuy] = useState('');
  const [tradeData, setTradeData] = useState<ZeroExAPIQuoteResponse>();
  const [haveFetched0x, setHaveFetched0x] = useState<boolean>(false);

  useEffect(() => {
    console.log('repay type', repayType);
  }, [repayType]);

  useEffect(() => {
    if (!selectedSellToken && !_.isEmpty(sourceAssetOptions)) {
      dispatch(
        TokensActions.setSelectedTokenAddress({
          tokenAddress: sourceAssetOptions[0].address,
        })
      );
    }
    if (!selectedTokenAddress && selectedSellToken) {
      setSelectedTokenAddress(selectedSellToken.address);
    }

    // if (!selectedPosition || !selectedSellToken) {
    //   return;
    // }

    // dispatch(TokensActions.getTokensDynamicData({ addresses: [initialToken] }));
  }, [selectedSellToken]);

  // Event Handlers

  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  const approveDepositAndRepay = () => {
    setLoading(true);
    if (!selectedPosition?.line || !selectedPosition) {
      setLoading(false);
      return;
    }
    let approvalOBj = {
      lineAddress: selectedPosition.line,
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
    if (!selectedPosition?.line) {
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

    console.log('repayTX', selectedPosition.line);

    dispatch(
      LinesActions.depositAndRepay({
        lineAddress: selectedPosition.line,
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
    if (!selectedPosition?.line || !selectedPosition || !walletNetwork) {
      setLoading(false);
      return;
    }

    dispatch(
      LinesActions.depositAndClose({
        lineAddress: selectedPosition.line,
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
    console.log(
      'repay modal: claimAndrepay()',
      tradeData,
      selectedPosition,
      !targetAmount,
      !selectedSellTokenAddress,
      !walletNetwork
    );
    if (!tradeData?.data || !selectedPosition?.line || !targetAmount || !selectedSellTokenAddress || !walletNetwork) {
      setLoading(false);
      return;
    }

    if (
      getAddress(tradeData.sellToken) !== getAddress(selectedSellTokenAddress) ||
      getAddress(tradeData.buyToken) !== getAddress(selectedPosition.token.address)
    ) {
      console.log(
        '0x quote for wrong tokens',
        tradeData.sellToken,
        selectedSellTokenAddress,
        tradeData.buyToken,
        selectedPosition.token.address
      );
      return;
    }

    dispatch(
      LinesActions.claimAndRepay({
        lineAddress: selectedPosition.line,
        claimToken: selectedSellTokenAddress,
        calldata: tradeData.data,
        network: walletNetwork,
      })
    ).then((res) => {
      console.log('repay modal: post claimAndrepay()', res);
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
    if (!tradeData?.data || !selectedPosition?.line || !targetAmount || !selectedSellTokenAddress || !walletNetwork) {
      setLoading(false);
      return;
    }
    if (
      getAddress(tradeData.sellToken) !== getAddress(selectedSellTokenAddress) ||
      getAddress(tradeData.buyToken) !== getAddress(selectedPosition.token.address)
    ) {
      console.log(
        '0x quote for wrong tokens',
        tradeData.sellToken,
        selectedSellTokenAddress,
        tradeData.buyToken,
        selectedPosition.token.address
      );
      return;
    }

    dispatch(
      LinesActions.claimAndTrade({
        lineAddress: selectedPosition.line,
        claimToken: selectedSellTokenAddress,
        calldata: tradeData.data,
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
    if (!selectedPosition?.line || !targetAmount || !selectedSellTokenAddress || !walletNetwork) {
      setLoading(false);
      return;
    }

    // dispatch(
    //   LinesActions.useAndRepay({
    //     lineAddress: selectedPosition.line,
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
    if (!selectedPosition || !selectedPosition || !targetAmount || !selectedSellTokenAddress || !walletNetwork) {
      setLoading(false);
      return;
    }

    dispatch(
      LinesActions.close({
        lineAddress: selectedPosition.line,
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

  // @cleanup TODO move directly into renderComponent(), dont need 2 switch statements
  const getActionsForRepayType = (type: { id: string; label: string; value: string }) => {
    // @TODO filter based off of userMetadata.role
    switch (type.id) {
      case 'close':
        return [
          {
            label: t('components.transaction.repay.close.cta'),
            onAction: closePosition,
            status: true,
            disabled: !transactionApproved,
            contrast: false,
          },
        ];
      case 'deposit-and-close':
        return [
          {
            label: t('components.transaction.repay.close.cta'),
            onAction: depositAndClose,
            status: true,
            disabled: !transactionApproved,
            contrast: false,
          },
        ];
      case 'unused':
        return [
          {
            label: t('components.transaction.use-and-repay.cta'),
            onAction: useAndRepay,
            status: true,
            disabled: !transactionApproved,
            contrast: false,
          },
        ];
      case 'claim-and-repay':
        return [
          {
            label: t('components.transaction.repay.claim-and-repay.cta'),
            onAction: claimAndRepay,
            status: true,
            disabled: !haveFetched0x,
            contrast: false,
          },
        ];
      case 'claim-and-trade':
        return [
          {
            label: t('components.transaction.repay.claim-and-trade.cta'),
            onAction: claimAndTrade,
            status: true,
            disabled: !transactionApproved,
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
            label: t('components.transaction.repay.deposit-and-repay.cta'),
            onAction: depositAndRepay,
            status: true,
            disabled: transactionApproved,
            contrast: false,
          },
        ];
    }
  };

  //const selectedPositionLineChange = (addr: string): void => {
  //  selectedPosition(addr);
  //  _updatePosition();
  //};

  const onSelectedTypeChange = (newRepayType: any): void => {
    setRepayType(newRepayType);
    // _updatePosition();
  };

  const onSelectedPositionChange = (arg: CreditPosition): void => {
    dispatch(LinesActions.setSelectedLinePosition({ position: arg.id }));
  };

  if (!selectedPosition) return null;
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

  let InputComponents; // might need to do this if returning from func causes rendering issues
  const renderInputComponents = () => {
    console.log('render repay inputs for type: ', repayType);
    switch (repayType.id) {
      case 'claim-and-repay':
      case 'claim-and-trade':
        // TODO set targetAmount to unused + getOwnerTokens

        const buyToken = selectedPosition.token.address;
        const sellToken = selectedSellToken.address;
        console.log(
          'repay from rev - buy/sell tokens',
          getAddress(buyToken) !== getAddress(sellToken),
          getAddress(buyToken),
          getAddress(sellToken)
        );

        if (getAddress(buyToken) !== getAddress(sellToken) && !haveFetched0x) {
          setHaveFetched0x(true);
          const tradeTx = getTradeQuote({
            // set fake data for testing 0x
            buyToken: DAI,
            sellToken: ETH,

            // buyToken,
            // sellToken,
            sellAmount: targetAmount,
            network: walletNetwork,
          }).then((result) => {
            console.log('repay modal: trade quote res', result, result?.buyAmount);
            if (result) {
              setTokensToBuy(result.buyAmount!);
              setTradeData(result);
            }
          });

          console.log('get 0x trade quote', tradeTx);
        }

        console.log(
          'repay modal: bought tokens qoute',
          tokensToBuy,
          tokensMap,
          !!tokensToBuy,
          tokensMap[DAI],
          tokensMap[ETH]
        );
        return (
          <>
            <TxTokenInput
              headerText={t('components.transaction.repay.claim-and-repay.claim-token')}
              inputText={tokenHeaderText}
              amount={normalizeAmount(targetAmount, selectedPosition.token.decimals)}
              onAmountChange={(amnt) => setTargetAmount(toWei(amnt, selectedPosition.token.decimals))}
              // token to claim from spigot
              // selectedToken={selectedSellToken}
              selectedToken={tokensMap[ETH]}
              onSelectedTokenChange={onSelectedSellTokenChange}
              // TODO get options from unusedToken data in subgraph
              tokenOptions={sourceAssetOptions}
              readOnly={true}
            />
            {/* trade data from 0x API response */}
            {!!tokensToBuy ? (
              <TxTokenInput
                headerText={t('components.transaction.repay.claim-and-repay.credit-token')}
                inputText={t('components.transaction.repay.claim-and-repay.buy-amount')}
                amount={normalizeAmount(tokensToBuy, selectedPosition.token.decimals)}
                selectedToken={tokensMap[DAI]}
                // selectedToken={selectedPosition.token}
                readOnly={true}
              />
            ) : (
              <TradeError> {t('components.transaction.repay.claim-and-repay.insufficient-liquidity')} </TradeError>
            )}
          </>
        );

      case 'deposit-and-close':
      case 'close':
      case 'deposit-and-repay':
      default:
        const isClosing = repayType.id !== 'deposit-and-repay';
        const amount = isClosing
          ? bn(selectedPosition.principal)!.add(bn(selectedPosition.interestAccrued)!)!.toString()
          : targetAmount;

        console.log('repay from wallet inputs. isClosing, amount', isClosing, amount);

        return (
          <TxTokenInput
            headerText={t('components.transaction.repay.select-amount')}
            inputText={tokenHeaderText}
            amount={normalizeAmount(amount, selectedPosition.token.decimals)}
            onAmountChange={(amnt) => setTargetAmount(toWei(amnt, selectedPosition.token.decimals))}
            // @cleanup TODO
            maxAmount={getMaxRepay()}
            selectedToken={selectedSellToken}
            onSelectedTokenChange={onSelectedSellTokenChange}
            // @cleanup TODO
            // tokenOptions={sourceAssetOptions}

            // inputError={!!sourceStatus.error}
            readOnly={isClosing ? true : false}
            // displayGuidance={displaySourceGuidance}
          />
        );
    }
  };

  return (
    <StyledTransaction onClose={onClose} header={header || t('components.transaction.repay.header')}>
      <TxPositionInput
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
      <TxRateInput
        headerText={t('components.transaction.repay.your-rates')}
        frate={selectedPosition.fRate}
        drate={selectedPosition.dRate}
        amount={selectedPosition.fRate}
        maxAmount={'100'}
        // setRateChange={onFrateChange}
        setRateChange={() => {}}
        readOnly={true}
      />
      <TxDropdown
        headerText={t('components.transaction.repay.repay-type')}
        inputText={t('components.transaction.repay.select-repay-option')}
        onSelectedTypeChange={onSelectedTypeChange}
        selectedType={repayType}
        typeOptions={allRepaymentOptions}
        // creditOptions={sourceCreditOptions}
        // inputError={!!sourceStatus.error}
      />
      {/* Make subcomponent to render diff payment option inputs */}
      {/* PRIORITY - repay to test 0x */}
      {/* <InputComponents /> */}
      {renderInputComponents()}

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
