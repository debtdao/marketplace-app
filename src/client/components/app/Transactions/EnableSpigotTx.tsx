import { FC, useState, useEffect } from 'react';
import styled from 'styled-components';
import _ from 'lodash';

import { isValidAddress } from '@src/utils';
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
  OnChainMetaDataActions,
  CollateralActions,
  selectDepositTokenOptionsByAsset,
  CollateralSelectors,
  OnChainMetaDataSelector,
} from '@store';
//import { Button, Icon, Link } from '@components/common';

import { TxContainer } from './components/TxContainer';
import { TxActionButton } from './components/TxActions';
import { TxActions } from './components/TxActions';
import { TxStatus } from './components/TxStatus';
import { TxAddressInput } from './components/TxAddressInput';
import { TxNumberInput } from './components/TxNumberInput';
import { TxByteInput } from './components/TxByteInput';
import { TxDropdown } from './components/TxDropdown';

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

  const selectedContractFunctions = useAppSelector(OnChainMetaDataSelector.selectFunctions);
  //state for params
  const { header, onClose } = props;

  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const [transactionApproved, setTransactionApproved] = useState(true);
  const [transactionLoading, setLoading] = useState(false);

  // spigot setting params
  const [settingOwnerSplit, setOwnerSplit] = useState('100');
  const [settingClaimFunc, setClaimFunc] = useState('');
  const [settingTransferFunc, setTransferFunc] = useState('');
  const [revenueContractAdd, setRevenueContractAdd] = useState<string>('');
  const [revContractABI, setRevenueContractABI] = useState(false);
  const [funcType, setFuncType] = useState({ id: '1', label: 'Repay from:', value: 'Wallet' });

  const selectedAssetAddress = useAppSelector(TokensSelectors.selectSelectedTokenAddress) || TOKEN_ADDRESSES.DAI;
  // TODO pull colalteralOptions from subgraph instread of default yearn tokens
  const collateralOptions = useAppSelector(selectDepositTokenOptionsByAsset)();
  //const selectedAsset  _.find(collateralOptions, (t) => t.address === selectedAssetAddress);
  // TODO get token prices from yearn API and display

  useEffect(() => {
    // if escrow not set yet then correct state
    if (selectedLine?.spigot && !selectedSpigotAddress) {
      dispatch(CollateralActions.setSelectedEscrow({ escrowAddress: selectedLine.spigot.id }));
    }
  });

  useEffect(() => {
    console.log('repay type', funcType);
  }, [funcType]);

  useEffect(() => {
    if (isValidAddress(revenueContractAdd)) {
      console.log(revenueContractAdd);
      dispatch(OnChainMetaDataActions.getABI(revenueContractAdd));
      setRevenueContractABI(true);
    } else {
      dispatch(OnChainMetaDataActions.clearABI());
      setRevenueContractABI(false);
      console.log('ClEAR STATE');
    }
  }, [revenueContractAdd]);

  const handleClaimChange = (byteCode: string) => {
    setClaimFunc(byteCode);
  };

  const handleTransferFuncChange = (byteCode: string) => {
    setTransferFunc(byteCode);
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

  const enableSpigot = () => {
    setLoading(true);

    // TODO set error in state to display no line selected

    if (!selectedLine || !selectedSpigotAddress) {
      console.log('no line/spigot to enable on', selectedLine?.id, selectedSpigotAddress);
      setLoading(false);
      return; // TODO throw error ot UI component
    }

    if (!selectedRevenueContractAddress) {
      console.log('no revenue contract selected to enable', selectedSpigotAddress);
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
      spigotAddress: selectedSpigotAddress,
      revenueContract: selectedRevenueContractAddress,
      setting: {
        ownerSplit: settingOwnerSplit,
        claimFunction: settingClaimFunc,
        transferOwnerFunction: settingTransferFunc,
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

  const handleChangeRevenue = (address: string) => {
    setRevenueContractAdd(address);
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

  const renderRevFunc = () => {
    if (revContractABI) {
      return (
        <TxDropdown
          headerText="2. Rev Contract Funcs"
          typeOptions={selectedContractFunctions}
          selectedType={funcType}
        ></TxDropdown>
      );
    } else {
      return (
        <TxByteInput
          headerText={t('components.transaction.enable-spigot.function-revenue')}
          inputText={' '}
          inputError={false}
          byteCode={settingClaimFunc}
          onByteCodeChange={handleClaimChange}
          readOnly={false}
        />
      );
    }
  };

  const renderTransferFunc = () => {
    console.log(selectedContractFunctions);
    if (revContractABI) {
      return (
        <TxDropdown
          headerText="2. Transfer Contract Funcs"
          typeOptions={selectedContractFunctions}
          selectedType={funcType}
        ></TxDropdown>
      );
    } else {
      return (
        <TxByteInput
          headerText={t('components.transaction.enable-spigot.function-transfer')}
          inputText={' '}
          inputError={false}
          byteCode={settingTransferFunc}
          onByteCodeChange={handleTransferFuncChange}
          readOnly={false}
        />
      );
    }
  };

  // TODO: Add logic that if a rev contract is verified and ABI is in state, dropdown for available state appears

  return (
    <StyledTransaction onClose={onClose} header={header}>
      <TxAddressInput
        headerText={t('components.transaction.enable-spigot.revenue-contract')}
        address={revenueContractAdd}
        onAddressChange={handleChangeRevenue}
      />
      {renderRevFunc()}
      {renderTransferFunc()}

      <TxActions>
        <TxActionButton
          key={t('components.transaction.enable-spigot.cta') as string}
          data-testid={`modal-action-${t('components.transaction.enable-spigot.cta').toLowerCase()}`}
          onClick={enableSpigot}
          disabled={!transactionApproved}
          contrast={true}
          isLoading={transactionLoading}
        >
          {t('components.transaction.enable-spigot.cta')}
        </TxActionButton>
      </TxActions>
    </StyledTransaction>
  );
};
