import { FC, useState } from 'react';
import styled from 'styled-components';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import _ from 'lodash';

import { TokenIcon } from '@components/app';
import { useAppDispatch, useAppSelector, useAppTranslation, useSpigotIntegration } from '@hooks';
import {
  Text,
  Icon,
  Button,
  SearchList,
  ChailinkIcon,
  ZapIcon,
  SearchListItem,
  UnlockProtocolLogo,
  SpigotLogo,
} from '@components/common';
import { humanize } from '@utils';
import integrationsList from '@config/constants/spigot-integrations.json';
import { SPIGOT_INTEGRATION_LIST, SpigotIntegration, UNLOCK_PROTOCOL } from '@src/core/types';
import { CollateralActions, CollateralSelectors } from '@src/core/store';

import { DescText, HeaderText } from './TxDetailsCopy';
import { TxAddressInput } from './TxAddressInput';

const StyledAmountInput = styled.input<{ readOnly?: boolean; error?: boolean }>`
  background: transparent;
  outline: none;
  border: none;
  color: ${({ theme }) => theme.colors.txModalColors.textContrast};
  padding: 0;
  font-family: inherit;
  appearance: textfield;
  width: 100%;

  &::placeholder {
    color: ${({ theme }) => theme.colors.txModalColors.textContrast};
  }

  ${({ readOnly, theme }) =>
    readOnly &&
    `
    color: ${theme.colors.txModalColors.text};
    cursor: default;

    &::placeholder {
      color: ${theme.colors.txModalColors.text};
    }
  `}

  ${({ error, theme }) => error && `color: ${theme.colors.txModalColors.error};`}

  ${() => `
    ::-webkit-outer-spin-button,
    ::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    };
  `}
`;

const AmountInputContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-top: 0.8rem;

  font-size: 2.4rem;
  font-weight: 700;
`;

const AddressTitle = styled(Text)`
  color: ${({ theme }) => theme.colors.txModalColors.text};
  text-overflow: ellipsis;
`;

const IntegrationData = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.globalRadius};
  background: ${({ theme }) => theme.colors.txModalColors.backgroundVariant};
  padding: ${({ theme }) => theme.layoutPadding};
  font-size: 1.4rem;
  flex: 1;
`;

const IntegrationName = styled.div`
  width: 100%;
  overflow: wrap;
  text-align: center;
  font-size: 1.3rem;
  max-height: 3rem;
`;

const IntegrationListIcon = styled(Icon)`
  position: absolute;
  top: 0.8rem;
  right: 0.4rem;
  color: ${({ theme }) => theme.colors.txModalColors.onBackgroundVariantColor};
`;

const IntegrationIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const IntegrationSelector = styled.div<{ onClick?: () => void; center?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: ${({ center }) => (center ? '100%' : '8.4rem')};
  height: ${({ center }) => (center ? '12.6rem' : undefined)};
  border-radius: ${({ theme }) => theme.globalRadius};
  background: ${({ theme }) => theme.colors.txModalColors.backgroundVariant};
  color: ${({ theme }) => theme.colors.txModalColors.textContrast};
  fill: ${({ theme }) => theme.colors.txModalColors.text};
  flex-shrink: 0;
  padding: 0 0.7rem;
  gap: 0.7rem;
  user-select: none;
  position: relative;
  ${({ onClick }) => onClick && 'cursor: pointer;'}
`;

const IntegrationInfo = styled.div<{ center?: boolean }>`
  display: flex;
  justify-content: ${({ center }) => (center ? 'center' : 'flex-start')};
  gap: ${({ theme }) => theme.txModal.gap};
  overflow: hidden;
`;

const StyledSearchList = styled(SearchList)`
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  transform-origin: bottom left;
`;

const Header = styled.div`
  font-size: 1.6rem;
  text-transform: capitalize;
  color: ${({ theme }) => theme.colors.txModalColors.text};
`;

const scaleTransitionTime = 300;

const StyledTxIntegrationInput = styled(TransitionGroup)`
  display: grid;
  // min-height: 15.6rem;
  width: 100%;
  border-radius: ${({ theme }) => theme.globalRadius};
  grid-gap: 0.8rem;

  .scale-enter {
    opacity: 0;
    transform: scale(0);
    transition: opacity ${scaleTransitionTime}ms ease, transform ${scaleTransitionTime}ms ease;
  }

  .scale-enter-active {
    opacity: 1;
    transform: scale(1);
  }

  .scale-exit {
    opacity: 1;
    transform: scale(1);
  }

  .scale-exit-active {
    opacity: 0;
    transform: scale(0);
    transition: opacity ${scaleTransitionTime}ms ease, transform ${scaleTransitionTime}ms cubic-bezier(1, 0.5, 0.8, 1);
  }
`;

type IntegrationInputStyles = 'amount' | 'oracle';

export interface TxIntegrationInputProps {
  headerText?: string;
  descText?: string;
  inputText?: string;
  inputError?: boolean;
  revenueContractAddress: string;
  onAddressChange: (address: string) => void;
  onSelectedIntegrationChange?: (integration: string) => void;
  integrationOptions?: SpigotIntegration[];
  readOnly?: boolean;
  loading?: boolean;
  loadingText?: string;
  displayGuidance?: boolean;
}

export const TxSpigotIntegrationSelector: FC<TxIntegrationInputProps> = ({
  headerText,
  descText,
  inputText,
  inputError,
  revenueContractAddress,
  onAddressChange,
  onSelectedIntegrationChange,
  integrationOptions,
  readOnly,
  loading,
  loadingText,
  displayGuidance,
  children,
  ...props
}) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const integrationName = useAppSelector(CollateralSelectors.selectSelectedSpigotIntegration);
  const selectedIntegration = useSpigotIntegration(integrationName);

  const listItems: SearchListItem[] =
    !integrationsList || _.keys(integrationsList).length === 0
      ? []
      : _.map(integrationsList, (val, key) => ({
          id: key,
          svg: getIntegrationIcon(key),
          // icon: val.icon,
          label: val.name,
          value: key,
        }));

  const openSearchList = () => {
    setOpenedSearch(true);
  };

  const [openedSearch, setOpenedSearch] = useState(false);

  const onIntegrationSelected = (name: SPIGOT_INTEGRATION_LIST) => {
    dispatch(CollateralActions.setSelectedSpigotIntegration({ name }));
    onSelectedIntegrationChange && onSelectedIntegrationChange(name);
  };

  const itemForSelected = _.find(listItems, (i) => i.id === integrationName)!;

  return (
    <StyledTxIntegrationInput {...props}>
      <>{headerText && <HeaderText>{headerText}</HeaderText>}</>
      <>{descText && <DescText>{descText}</DescText>}</>

      {/* NOTE Using fragments here because: https://github.com/yearn/yearn-finance-v3/pull/565 */}
      <>
        <IntegrationInfo center={false}>
          <IntegrationSelector onClick={listItems?.length > 0 ? openSearchList : undefined} center={false}>
            <IntegrationIconContainer>
              <TokenIcon SVG={itemForSelected.svg} symbol={itemForSelected.label} size="small" />
              {listItems?.length > 1 && <IntegrationListIcon Component={TokenIcon} />}
            </IntegrationIconContainer>
            <IntegrationName>{selectedIntegration.name}</IntegrationName>
          </IntegrationSelector>

          <IntegrationData>
            {openedSearch && (
              <CSSTransition in={openedSearch} appear={true} timeout={scaleTransitionTime} classNames="scale">
                <StyledSearchList
                  list={listItems}
                  headerText={t('components.transaction.enable-spigot.select-integration')}
                  selected={itemForSelected}
                  setSelected={(item) => onIntegrationSelected(item.id as SPIGOT_INTEGRATION_LIST)}
                  onCloseList={() => setOpenedSearch(false)}
                />
              </CSSTransition>
            )}

            <TxAddressInput address={revenueContractAddress} onAddressChange={onAddressChange} />
          </IntegrationData>
        </IntegrationInfo>
      </>
    </StyledTxIntegrationInput>
  );
};

const getIntegrationIcon = (name: string): React.FC => {
  switch (name) {
    case UNLOCK_PROTOCOL:
      return UnlockProtocolLogo;
    case 'custom':
    default:
      return SpigotLogo;
  }
};
