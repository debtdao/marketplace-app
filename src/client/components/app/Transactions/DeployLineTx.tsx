import { FC, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BigNumber } from 'ethers';
import styled from 'styled-components';

import { getLineFactoryforNetwork } from '@utils';
import { isAddress, toWei } from '@utils';
import { useAppTranslation, useAppDispatch, useAppSelector } from '@hooks';
import { LinesActions, LinesSelectors, NetworkSelectors, RouteActions, WalletSelectors } from '@store';
import { getConstants } from '@src/config/constants';
import { DeploySecuredLineWithConfigProps } from '@src/core/types';

import { Button, Link, RedirectIcon, ToggleButton } from '../../common';

import { TxContainer } from './components/TxContainer';
import { TxAddressInput } from './components/TxAddressInput';
import { TxTTLInput } from './components/TxTTLInput';
import { TxActions } from './components/TxActions';
import { TxActionButton } from './components/TxActions';
import { TxNumberInput } from './components/TxNumberInput';
import { TxStatus } from './components/TxStatus';

const StyledTransaction = styled(TxContainer)``;

const SectionContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  grid-gap: 1.2rem;
  justify-content: right;
`;

const RouterLink = styled(Link)<{ selected: boolean }>`
  display: flex;
  justify-content: center;
  flex-direction: row;
  align-items: center;
  color: inherit;
  font-size: 1.2rem;
  flex: 1;
  padding: 0.5rem;

  &:hover span {
    filter: brightness(90%);
  }

  span {
    transition: filter 200ms ease-in-out;
  }
  ${(props) =>
    props.selected &&
    `
    color: ${props.theme.colors.titlesVariant};
  `}
`;
interface DeployLineProps {
  header: string;
  onClose: () => void;
  onPositionChange: (data: {
    credit?: string;
    token?: string;
    amount?: string;
    drate?: string;
    frate?: string;
  }) => void;
}

export const DeployLineTx: FC<DeployLineProps> = (props) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const history = useHistory();

  // Deploy Line base data state
  const currentNetwork = useAppSelector(NetworkSelectors.selectCurrentNetwork);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const walletAddress = useAppSelector(WalletSelectors.selectSelectedAddress);

  const [transactionCompleted, setTransactionCompleted] = useState(0);
  const { header, onClose } = props;
  const [borrowerAddress, setBorrowerAddress] = useState(walletAddress ? walletAddress : '');
  const [inputAddressWarning, setWarning] = useState('');
  const [inputTTLWarning, setTTLWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeToLive, setTimeToLive] = useState('0');
  const [lineAddress, setLineAddress] = useState('');

  // Deploy Line with config state
  const [advancedMode, setAdvancedMode] = useState(true);
  const [cratio, setCratio] = useState('0');
  const [revenueSplit, setRevenueSplit] = useState('0');

  const toggleSecuredMode = () => {
    setAdvancedMode(!advancedMode);
  };

  const onAmountChange = (ttl: string) => {
    if (Number(ttl) <= 0) {
      setTimeToLive(ttl.toString());
      setTTLWarning('Increase TTL, cannot be 0.');
      return;
    }
    if (Number(ttl) > 0) {
      setTimeToLive(ttl.toString());
      setTTLWarning('');
    }
  };

  const onCratioChange = (amount: string) => {
    setCratio(amount);
  };

  const onRevenueSplitChange = (amount: string) => {
    setRevenueSplit(amount);
  };

  const onTransactionCompletedDismissed = () => {
    if (onClose) {
      onClose();
    } else {
      setTransactionCompleted(0);
    }
  };

  const onBorrowerAddressChange = (address: string) => {
    setBorrowerAddress(address);
  };

  const deploySecuredLineNoConfig = async () => {
    setLoading(true);
    let checkSumAddress = await isAddress(borrowerAddress);
    let ttl = Number(timeToLive) * 24 * 60 * 60;

    if (!checkSumAddress || walletNetwork === undefined) {
      setWarning('Incorrect address, please verify and try again.');
      return;
    }

    if (Number(timeToLive) <= 0) {
      setTTLWarning('Increase TTL, cannot be 0.');
      return;
    }

    try {
      // TODO Dynamic var based on network

      dispatch(
        LinesActions.deploySecuredLine({
          factory: getLineFactoryforNetwork(walletNetwork!)!,
          borrower: borrowerAddress,
          ttl: BigNumber.from(ttl.toFixed(0)),
          network: walletNetwork,
        })
      ).then((res) => {
        if (res.meta.requestStatus === 'rejected') {
          // setTransactionCompleted(2);
          setLoading(false);
        }
        if (res.meta.requestStatus === 'fulfilled') {
          setTransactionCompleted(1);
          setLoading(false);
        }
      });
    } catch (e) {
      console.log(e);
    }
  };

  const deploySecuredLineWithConfig = async () => {
    setLoading(true);
    let checkSumAddress = await isAddress(borrowerAddress);

    let ttl = Number(timeToLive) * 24 * 60 * 60;

    if (!checkSumAddress || walletNetwork === undefined) {
      setWarning('Incorrect address, please verify and try again.');
      return;
    }
    // BPS IS USED so we must multiply by 10^2
    let BNCratio = toWei(cratio, 2);

    try {
      // TODO Dynamic var based on network
      dispatch(
        LinesActions.deploySecuredLineWithConfig({
          factory: getLineFactoryforNetwork(walletNetwork!)!,
          borrower: borrowerAddress,
          ttl: BigNumber.from(ttl.toFixed(0)),
          network: walletNetwork,
          revenueSplit: BigNumber.from(revenueSplit),
          cratio: BigNumber.from(BNCratio),
        })
      ).then((res) => {
        if (res.meta.requestStatus === 'rejected') {
          setLoading(false);
        }
        if (res.meta.requestStatus === 'fulfilled') {
          const { lineAddress } = res.payload as {
            lineAddress: string;
            deployData: DeploySecuredLineWithConfigProps;
          };
          setLineAddress(lineAddress);
          setTransactionCompleted(1);
          setLoading(false);
          // history.push(`/${currentNetwork}/lines/${lineAddress}`);
        }
      });
    } catch (e) {
      console.log(e);
    }
  };

  if (transactionCompleted === 1) {
    return (
      <StyledTransaction onClose={onClose} header={'Transaction complete'}>
        <TxStatus
          success={transactionCompleted}
          link={`/${currentNetwork}/lines/${lineAddress}`}
          transactionCompletedLabel={t('components.transaction.deploy-line.success-message')}
          exit={onTransactionCompletedDismissed}
        />
      </StyledTransaction>
    );
  }

  if (transactionCompleted === 2) {
    return (
      <StyledTransaction onClose={onClose} header={'Transaction failed'}>
        <TxStatus
          success={transactionCompleted}
          transactionCompletedLabel={t('components.transaction.deploy-line.error-message')}
          exit={onTransactionCompletedDismissed}
        />
      </StyledTransaction>
    );
  }

  // add Learn More link to SecuredLine docs. Then how  to deploy a secured line docs
  return (
    <StyledTransaction
      onClose={onClose}
      header={header || t('components.transaction.title')}
      subheader={t('components.transaction.deploy-line.subheader')}
      learnMoreUrl="https://debtdao.org/products/secured-line-of-credit"
    >
      <TxAddressInput
        key={'credit-input'}
        headerText={t('components.transaction.deploy-line.select-borrower')}
        inputText={t('components.transaction.deploy-line.borrower-address-text')}
        onAddressChange={onBorrowerAddressChange}
        address={borrowerAddress}
        // creditOptions={sourceCreditOptions}
        // inputError={!!sourceStatus.error}
        readOnly={false}
        // displayGuidance={displaySourceGuidance}
      />
      {inputAddressWarning !== '' ? <div style={{ color: '#C3272B' }}>{inputAddressWarning}</div> : ''}
      <TxTTLInput
        headerText={t('components.transaction.deploy-line.select-ttl')}
        descText={t('components.transaction.deploy-line.select-ttl-desc')}
        inputText={t('components.transaction.deploy-line.time-to-live')}
        inputError={false}
        amount={timeToLive}
        onAmountChange={onAmountChange}
        maxAmount={'365'}
        maxLabel={'Max'}
        readOnly={false}
        hideAmount={false}
        loading={false}
        loadingText={''}
      />
      {inputTTLWarning !== '' ? <div style={{ color: '#C3272B' }}>{inputTTLWarning}</div> : ''}
      {advancedMode ? (
        <SectionContent>
          <TxNumberInput
            headerText={t('components.transaction.deploy-line.cratio')}
            descText={t('components.transaction.deploy-line.cratio-desc')}
            inputLabel={t('components.transaction.deploy-line.cratio-input')}
            inputAlign="right"
            width={'sm'}
            placeholder={'30%'}
            amount={cratio}
            maxAmount={'max string'}
            onInputChange={onCratioChange}
            readOnly={false}
            hideAmount={false}
            inputError={false}
          />
          <TxNumberInput
            headerText={t('components.transaction.deploy-line.revenue-split')}
            descText={t('components.transaction.deploy-line.revenue-split-desc')}
            inputLabel={t('components.transaction.deploy-line.revenue-split-input')}
            inputAlign="right"
            width={'sm'}
            placeholder={'90%'}
            amount={revenueSplit}
            maxAmount={'max string'}
            onInputChange={onRevenueSplitChange}
            readOnly={false}
            hideAmount={false}
            inputError={false}
          />
        </SectionContent>
      ) : (
        <h6>You should not deploy a line without discussing terms.</h6>
      )}
      <TxActions>
        <TxActionButton
          key={''}
          onClick={advancedMode ? deploySecuredLineWithConfig : deploySecuredLineNoConfig}
          disabled={false}
          contrast={false}
          isLoading={loading}
        >
          {'Deploy Line'}
        </TxActionButton>
      </TxActions>
    </StyledTransaction>
  );
};
