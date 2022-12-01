import { FC, useState, useEffect } from 'react';
import styled from 'styled-components';
import _ from 'lodash';

//import { useHistory } from 'react-router-dom';

import {
  useAppTranslation,
  useAppDispatch,
  // used to dummy token for dev
  useAppSelector,
} from '@hooks';
import { ACTIVE_STATUS, AddSpigotProps } from '@src/core/types';
import { TOKEN_ADDRESSES } from '@src/config/constants';
import {
  TokensSelectors,
  WalletSelectors,
  LinesSelectors,
  CollateralActions,
  selectDepositTokenOptionsByAsset,
  CollateralSelectors,
} from '@store';
import { isAddress, isFnSelector } from '@utils';
//import { Button, Icon, Link } from '@components/common';

import { TxContainer } from './components/TxContainer';
import { TxActionButton } from './components/TxActions';
import { TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';
import { TxAddressInput } from './components/TxAddressInput';
import { TxNumberInput } from './components/TxNumberInput';
import { TxByteInput } from './components/TxByteInput';

const StyledTransaction = styled(TxContainer)`
  min-height: 60vh;
`;

interface EnableSpigotTxProps {
  header: string;
  onClose: () => void;
}

//const BadLineErrorContainer = styled.div``;

//const BadLineErrorBody = styled.h3`
//  ${({ theme }) => `
//    margin: ${theme.spacing.lg} 0;
//    font-size: ${theme.fonts.sizes.md};;
//  `}
//`;

//const BadLineErrorImageContainer = styled.div``;

//const BadLineErrorImage = styled.img``;

//const StyledTxActionButton = styled(Button)<{ color?: string; contrast?: boolean }>`
//  height: 4rem;
//  flex: 1;
//  font-size: 1.6rem;
//  font-weight: 700;
//  gap: 0.5rem;
//  background-color: ${({ theme }) => theme.colors.txModalColors.primary};
//  color: ${({ theme }) => theme.colors.txModalColors.onPrimary};
//`;

export const EnableSpigotTx: FC<EnableSpigotTxProps> = (props) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  //const history = useHistory();

  // user data
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const walletIsConnected = useAppSelector(WalletSelectors.selectWalletIsConnected);
  const walletAddresssk = useAppSelector(WalletSelectors.selectSelectedAddress);
  //const userMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  // need to get call statusMap from state for tx error messages
  //const collateralStatusMap = useAppSelector(CollateralSelectors.selectStatusMap);
  const selectedSpigotAddress = useAppSelector(CollateralSelectors.selectSelectedSpigot);
  const selectedRevenueContractAddress = useAppSelector(CollateralSelectors.selectSelectedRevenueContract);

  //state for params
  const { header, onClose } = props;

  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const [transactionApproved, setTransactionApproved] = useState(true);
  const [transactionLoading, setLoading] = useState(false);

  // spigot setting params
  const [settingOwnerSplit, setOwnerSplit] = useState('100');
  const [revenueContractAddress, setRevenueContractAddress] = useState('');
  const [claimFuncSelector, setClaimFuncSelector] = useState('');
  const [transferFuncSelector, setTransferFuncSelector] = useState('');

  const selectedAssetAddress = useAppSelector(TokensSelectors.selectSelectedTokenAddress) || TOKEN_ADDRESSES.DAI;
  // TODO pull colalteralOptions from subgraph instread of default yearn tokens
  const collateralOptions = useAppSelector(selectDepositTokenOptionsByAsset)();
  //const selectedAsset = _.find(collateralOptions, (t) => t.address === selectedAssetAddress);
  // TODO get token prices from yearn API and display

  useEffect(() => {
    // if escrow not set yet then correct state
    if (selectedLine?.spigot && !selectedSpigotAddress) {
      dispatch(CollateralActions.setSelectedEscrow({ escrowAddress: selectedLine.spigot.id }));
    }
  });

  const handleAddressChange = (text: string) => {
    setRevenueContractAddress(text);
  };

  const handleClaimChange = (byteCode: string) => {
    setClaimFuncSelector(byteCode);
  };

  const handleTransferFuncChange = (byteCode: string) => {
    setTransferFuncSelector(byteCode);
  };

  const notArbiter = selectedLine?.status === ACTIVE_STATUS; // TODO
  if (!notArbiter) {
    // onClose(); // close modal and exit
    return null;
  }

  // Event Handlers
  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  const canProceed = (): boolean => {
    if (!isAddress(revenueContractAddress) || !isFnSelector(claimFuncSelector) || !isFnSelector(transferFuncSelector))
      return false;
    return true;
  };

  const enableSpigot = () => {
    if (!canProceed()) {
      console.log('inputs are not valid');
      // TODO: should display some sort of error
    }
    setLoading(true);

    // TODO set error in state to display no line selected
    console.log({ selectedLine, selectedSpigotAddress });
    if (!selectedLine) {
      console.log('no line to enable on');
      setLoading(false);
      return; // TODO throw error ot UI component
    }

    if (!selectedLine?.spigot) {
      console.log('no spigot');
      setLoading(false);
      return; // TODO throw error ot UI component
    }

    console.log('wallet network on enable spigy tx', walletNetwork, walletIsConnected, walletAddresssk);
    if (!walletNetwork) {
      setLoading(false);
      return; // TODO throw error ot UI component
    }

    const transactionData: AddSpigotProps = {
      network: walletNetwork,
      lineAddress: selectedLine.id,
      spigotAddress: selectedLine?.spigot?.id as string,
      revenueContract: revenueContractAddress,
      setting: {
        ownerSplit: settingOwnerSplit,
        claimFunction: claimFuncSelector,
        transferOwnerFunction: transferFuncSelector,
      },
    };

    dispatch(CollateralActions.addSpigot(transactionData)).then((res) => {
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

  if (!selectedLine) return null;

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
          transactionCompletedLabel={t('components.transaction.enable-spigot.enable-failed')}
          exit={onTransactionCompletedDismissed}
        />
      </StyledTransaction>
    );
  }

  return (
    <StyledTransaction onClose={onClose} header={header}>
      <TxAddressInput
        headerText={t('components.transaction.enable-spigot.revenue-contract')}
        address={revenueContractAddress}
        onAddressChange={handleAddressChange}
        inputError={!isAddress(revenueContractAddress)}
      />
      <TxByteInput
        headerText={t('components.transaction.enable-spigot.function-revenue')}
        inputText={' '}
        inputError={!isFnSelector(claimFuncSelector)}
        byteCode={claimFuncSelector}
        onByteCodeChange={handleClaimChange}
        readOnly={false}
      />
      <TxByteInput
        headerText={t('components.transaction.enable-spigot.function-transfer')}
        inputText={' '}
        inputError={!isFnSelector(transferFuncSelector)}
        byteCode={transferFuncSelector}
        onByteCodeChange={handleTransferFuncChange}
        readOnly={false}
      />

      <TxActions>
        <TxActionButton
          key={t('components.transaction.enable-spigot.cta') as string}
          data-testid={`modal-action-${t('components.transaction.enable-spigot.cta').toLowerCase()}`}
          onClick={enableSpigot}
          disabled={!canProceed() || !transactionApproved}
          contrast={true}
          isLoading={transactionLoading}
        >
          {t('components.transaction.enable-spigot.cta')}
        </TxActionButton>
      </TxActions>
    </StyledTransaction>
  );
};
