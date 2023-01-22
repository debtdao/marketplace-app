import _ from 'lodash';
import styled from 'styled-components';
import { BigNumber, BytesLike, ethers } from 'ethers';
import { FC, useState, useEffect } from 'react';
import { getAddress } from '@ethersproject/address';

import { formatAmount, normalizeAmount, toWei, depositAndRepayUpdate, normalize, bn, getTradeQuote } from '@utils';
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
import { Balance, CreditPosition, RevenueSummary, TokenView, ZeroExAPIQuoteResponse } from '@src/core/types';

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
      id: 'use-and-repay',
      label: t('components.transaction.repay.use-and-repay.title'),
      value: t('components.transaction.repay.use-and-repay.desc'),
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
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  // const selectedSpigot = useAppSelector(CollateralSelectors.selectSpigotForSelectedLine);
  const reservesMap = useAppSelector(CollateralSelectors.selectReservesMap);
  const userMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const positions = useAppSelector(LinesSelectors.selectPositionsForSelectedLine);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const selectedSellTokenAddress = useAppSelector(TokensSelectors.selectSelectedTokenAddress);
  const initialToken: string = selectedSellTokenAddress ?? selectedPosition?.token.address ?? DAI;

  // @cleanup TODO only use sell token for claimAndRepay/Trade. use selectedPosition.token for everything else
  const { selectedSellToken, sourceAssetOptions } = useSelectedSellToken({
    selectedSellTokenAddress: initialToken,
    // selectedVaultOrLab: useAppSelector(VaultsSelectors.selectRecommendations)[0],
    allowTokenSelect: true,
  });
  console.log('deposit and repay selected position: ', selectedPosition);

  // used for 0x testing
  const tokensMap = useAppSelector(TokensSelectors.selectTokensMap);

  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const [transactionLoading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>(['']);
  const [transactionApproved, setTransactionApproved] = useState(true);
  const [targetAmount, setTargetAmount] = useState('0');

  const [selectedTokenAddress, setSelectedTokenAddress] = useState('');
  const [tokensToBuy, setTokensToBuy] = useState('0');
  const [tradeData, setTradeData] = useState<ZeroExAPIQuoteResponse>();
  const [haveFetched0x, setHaveFetched0x] = useState<boolean>(false);
  const [isTrade, setIsTrade] = useState<boolean>(false);

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

  useEffect(() => {
    // populate collateral reservesmap in redux state
    console.log('revenue token: ', 'am I here?', !reservesMap);
    if (Object.keys(reservesMap).length === 0) {
      // dispatch(CollateralActions.getReservesMap());
      // get all collateral tokens of type revenue
      const lineRevenueSummary = selectedLine!.spigot!.revenueSummary;
      const revenueCollateralTokens: RevenueSummary[] = Object.values(lineRevenueSummary).filter(
        (token) => token.type === 'revenue'
      );

      // populate reserves map with each revenue collateral token
      for (const token of revenueCollateralTokens as RevenueSummary[]) {
        console.log('revenue token: ', token);
        dispatch(
          CollateralActions.tradeable({
            lineAddress: getAddress(selectedPosition!.line),
            spigotAddress: getAddress(selectedLine!.spigotId),
            tokenAddress: getAddress(token.token.address),
            network: walletNetwork!,
          })
        );
      }
    }
  }, []);

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

  // @cleanup make HoF for repay actions - genPaymentMethod(action) => (validatorFunc) => (data) => { validateFunc(data); dispatch(action, data).then(handleGoodAction);}
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

    console.log('deposit and repay repayTX', selectedPosition.line);

    console.log('deposit and repay txn target amount: ', targetAmount);
    console.log(
      'deposit and repay txn target amount adj 1: ',
      ethers.utils.parseUnits(targetAmount, selectedPosition.token.decimals)
    );
    console.log(
      'deposit and repay txn target amount adj 2: ',
      ethers.utils.parseUnits(targetAmount, selectedPosition.token.decimals).toString()
    );
    // TODO: Add unit test for submitting txns
    dispatch(
      LinesActions.depositAndRepay({
        lineAddress: selectedPosition.line,
        // amount: ethers.utils.parseEther(targetAmount),
        amount: ethers.utils.parseUnits(targetAmount, selectedPosition.token.decimals),
        // amount: ethers.utils.formatUnits(targetAmount, selectedPosition.token.decimals),
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
    console.log(
      'claim and trade params: ',
      tradeData!.data,
      selectedPosition,
      targetAmount,
      selectedSellTokenAddress,
      walletNetwork
    );
    setLoading(true);
    // TODO set error in state to display no line selected
    if (
      tradeData?.data === undefined ||
      !selectedPosition?.line ||
      !targetAmount ||
      !selectedSellTokenAddress ||
      !walletNetwork
    ) {
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
    // // TODO set error in state to display no line selected
    if (!selectedPosition?.line || !targetAmount || !walletNetwork) {
      setLoading(false);
      return;
    }

    // TODO: determine why this throws "conditional hook called" even tho its an action + not being called anywher except callback. Disabled the rule-of-hooks for now for this specific line.
    dispatch(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      LinesActions.useAndRepay({
        lineAddress: selectedPosition.line,
        amount: ethers.utils.parseUnits(targetAmount, selectedPosition.token.decimals),
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

  // @cleanup TODO move directly into renderInputComponents() or a map, dont need 2 switch statements
  const getActionsForRepayType = (type: { id: string; label: string; value: string }, isTrade: boolean) => {
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
      case 'use-and-repay':
        return [
          {
            label: t('components.transaction.repay.use-and-repay.cta'),
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
        switch (isTrade) {
          case true:
            return [
              {
                label: t('components.transaction.repay.claim-and-trade.cta'),
                onAction: claimAndTrade,
                status: true,
                disabled: !transactionApproved,
                contrast: false,
              },
            ];
          default:
            return [
              {
                label: t('components.transaction.repay.approve-funds-for-repayment.cta'),
                onAction: claimAndTrade,
                status: true,
                disabled: !transactionApproved,
                contrast: false,
              },
            ];
        }
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
  const getMaxRepay = (): string => {
    if (!selectedPosition) {
      return '0';
    }
    const maxRepay: string = `${Number(selectedPosition.principal) + Number(selectedPosition.interestAccrued)}`;

    return normalizeAmount(maxRepay, selectedPosition.token.decimals);
  };

  console.log('selected sell token: ', selectedSellToken);
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
  // @cleanup TODO try and move to its own component
  const renderInputComponents = () => {
    console.log('render repay inputs for type: ', repayType);
    switch (repayType.id) {
      case 'claim-and-repay':
      case 'claim-and-trade':
        // TODO set targetAmount to unused + getOwnerTokens

        const buyToken = getAddress(selectedPosition.token.address);
        const sellToken = getAddress(selectedSellToken.address);
        const isTrade = buyToken !== sellToken;

        if (getAddress(buyToken) !== getAddress(sellToken) && !haveFetched0x) {
          // if (!haveFetched0x) {
          const tradeTx = getTradeQuote({
            // set fake data for testing 0x
            // buyToken: DAI,
            // sellToken: ETH,

            buyToken,
            sellToken,
            sellAmount: targetAmount,
            network: walletNetwork,
          }).then((result) => {
            console.log('repay modal: trade quote res', result, result?.buyAmount);
            if (result) {
              setIsTrade(true);
              setHaveFetched0x(true);
              setTokensToBuy(result.buyAmount!);
              setTradeData(result);
            }
            // TODO: Mock 0x trade when buyTokena and sellToken are not the same
            // console.log('Set Trade Data');
            // setTradeData({
            //   data: '0x' as BytesLike,
            //   buyToken: buyToken,
            //   sellToken: sellToken,
            // } as ZeroExAPIQuoteResponse);
          });

          console.log('get 0x trade quote', tradeTx);
        }
        // when buyToken and sellToken addresses are identical, don't use 0x
        else if (!haveFetched0x) {
          // not buying via 0x, but claiming so that position can be repaid

          // dispatch(
          //   CollateralActions.tradeable({
          //     lineAddress: getAddress(selectedPosition.line),
          //     spigotAddress: getAddress(selectedLine!.spigotId),
          //     // spigotAddress: getAddress(selectedSpigot),
          //     tokenAddress: getAddress(buyToken),
          //     network: walletNetwork!,
          //   })
          // );
          setHaveFetched0x(true);
          setTokensToBuy(targetAmount);
          // fake 0x transaction data so revenue token can be claimed and used for repayment
          setTradeData({
            data: '0x' as BytesLike,
            buyToken: buyToken,
            sellToken: buyToken,
          } as ZeroExAPIQuoteResponse);
        }

        const claimTargetBalance = normalizeAmount(
          reservesMap[getAddress(selectedPosition.line)]
            ? reservesMap[getAddress(selectedPosition.line)][selectedSellToken.address].ownerTokens
            : '0',
          selectedSellToken.decimals
        );

        const claimTokenHeaderText = `${t('components.transaction.token-input.you-have')} ${formatAmount(
          claimTargetBalance,
          4
        )} ${selectedSellToken.symbol}`;

        const claimableTokenAddresses = reservesMap[getAddress(selectedPosition.line)]
          ? Object.keys(reservesMap[getAddress(selectedPosition.line)])
          : [];

        // TODO: test claimableTokenOptions on Ethereum mainnet
        const claimableTokenOptions: TokenView[] = claimableTokenAddresses.map((address) => {
          if (walletNetwork === 'goerli') {
            return testTokens.find((token) => token.address === address)!;
          } else {
            const tokenData = tokensMap[address];
            const userTokenData = {} as Balance;
            const allowancesMap = {};
            return createToken({ tokenData, userTokenData, allowancesMap });
          }
        });
        // console.log('claimableTokens - addresses: ', claimableTokenAddresses);
        // console.log('claimableTokens - options: ', claimableTokenOptions);

        return (
          <>
            {/* TODO: Select from available revenue tokens */}
            <TxTokenInput
              headerText={t('components.transaction.repay.claim-and-repay.claim-token')}
              inputText={claimTokenHeaderText}
              // amount={normalizeAmount(targetAmount, selectedPosition.token.decimals)}
              amount={sellToken === buyToken ? claimTargetBalance : targetAmount}
              // onAmountChange={(amnt) => setTargetAmount(toWei(amnt, selectedPosition.token.decimals))}
              onAmountChange={(amnt) => setTargetAmount(amnt)}
              // token to claim from spigot
              selectedToken={selectedSellToken}
              // 0x testing data
              // selectedToken={tokensMap[ETH]}
              onSelectedTokenChange={onSelectedSellTokenChange}
              tokenOptions={claimableTokenOptions} // TODO get options from unusedToken data in subgraph
              readOnly={sellToken === buyToken ? true : false}
            />
            {/* rendner tokens to purchase based on trade data from 0x API response */}
            {sellToken !== buyToken ? (
              <>
                <TxTokenInput
                  headerText={t('components.transaction.repay.claim-and-repay.credit-token')}
                  inputText={t('components.transaction.repay.claim-and-repay.buy-amount')}
                  // amount={normalizeAmount(tokensToBuy, selectedPosition.token.decimals)}
                  // amount={tokensToBuy} // TODO: uncomment this after testing 0x trade data.
                  amount={targetAmount} // TODO: delete this after confirming 0x trade data is working.
                  selectedToken={selectedPosition.token}
                  // 0x testing data
                  // selectedToken={tokensMap[DAI]}
                  readOnly={false} // TODO: set back to true after testing 0x trade data
                />
                <TradeError> {t('components.transaction.repay.claim-and-repay.insufficient-liquidity')} </TradeError>
              </>
            ) : null}
          </>
        );

      case 'deposit-and-close':
      case 'close':
      case 'use-and-repay':
        return (
          <TxTokenInput
            headerText={t('components.transaction.repay.select-amount')}
            inputText={tokenHeaderText}
            // TODO: Note - RepayPositionTxn is the only one that normalizes the amount field
            // amount={normalizeAmount(amount, selectedPosition.token.decimals)}
            amount={targetAmount}
            // TODO: Note - RepayPositionTxn is the only one that sets targetAmount in wei instead of string
            // onAmountChange={(amnt) => setTargetAmount(toWei(amnt, selectedPosition.token.decimals))}
            onAmountChange={(amnt) => setTargetAmount(amnt)}
            // @cleanup TODO
            maxAmount={getMaxRepay()}
            selectedToken={selectedSellToken}
            onSelectedTokenChange={onSelectedSellTokenChange}
            readOnly={false}
          />
        );
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
            // TODO: Note - RepayPositionTxn is the only one that normalizes the amount field
            // amount={normalizeAmount(amount, selectedPosition.token.decimals)}
            amount={targetAmount}
            // TODO: Note - RepayPositionTxn is the only one that sets targetAmount in wei instead of string
            // onAmountChange={(amnt) => setTargetAmount(toWei(amnt, selectedPosition.token.decimals))}
            onAmountChange={(amnt) => setTargetAmount(amnt)}
            // @cleanup TODO
            maxAmount={getMaxRepay()}
            selectedToken={selectedSellToken}
            onSelectedTokenChange={onSelectedSellTokenChange}
            readOnly={isClosing ? true : false}
          />
        );
    }
  };

  return (
    <StyledTransaction onClose={onClose} header={header || t('components.transaction.repay.header')}>
      <TxPositionInput
        headerText={t('components.transaction.repay.select-position')}
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
        inputText={t('components.transaction.repay.select-repay')}
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
        {getActionsForRepayType(repayType, isTrade).map(({ label, onAction, status, disabled, contrast }) => (
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
