import styled from 'styled-components';

import { Button, Icon, WarningFilledIcon } from '@components/common';
import { device } from '@themes/default';

const ActionButtonsContainer = styled.div<{ actions: number; direction?: string }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.layoutPadding};
  flex-direction: column;
`;

const AlertIcon = styled(Icon)`
  width: 1.6rem;
  fill: ${({ theme }) => theme.colors.titles};
`;

const AlertButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.8rem;
  border: 2px solid ${({ theme }) => theme.colors.vaultActionButton.selected.borderColor};
  background: ${({ theme }) => theme.colors.vaultActionButton.iconFill};
  width: 2.8rem;
  height: 2.8rem;
`;

const ActionButton = styled(Button)<{ hide?: boolean }>`
  background: ${({ theme }) => theme.colors.vaultActionButton.background};
  color: ${({ theme }) => theme.colors.vaultActionButton.color};
  border: 2px solid ${({ theme }) => theme.colors.vaultActionButton.borderColor};
  padding: 0 1.6rem;
  max-width: 11rem;
  min-width: 9.6rem;

  ${({ hide }) => hide && `visibility: hidden;`}

  &[disabled],
  &.disabled {
    opacity: 0.6;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceVariantB};
    color: ${({ theme }) => theme.colors.vaultActionButton.selected.color};
    border: 4px solid ${({ theme }) => theme.colors.vaultActionButton.selected.borderColor};
  }
`;

interface ActionButtonsProps {
  actions: Array<{
    name: string;
    handler: (value1?: string, value2?: string, value3?: string) => void;
    disabled?: boolean;
    hide?: boolean;
  }>;
  direction?: 'row' | 'column';
  value1?: string;
  value2?: string;
  value3?: string;
  alert?: string;
}

export const ActionButtons = ({ actions, alert, direction, value1, value2, value3 }: ActionButtonsProps) => (
  <ActionButtonsContainer actions={actions.length} direction={direction}>
    {alert && (
      <AlertButton
        title={alert}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <AlertIcon Component={WarningFilledIcon} />
      </AlertButton>
    )}

    {actions.map(({ name, handler, disabled, hide, ...props }) => (
      <ActionButton
        className="action-button"
        data-testid={`action-${name.toLowerCase()}`}
        key={`action-${name}`}
        onClick={(e: Event) => {
          e.stopPropagation();
          console.log('Values: ', value1, value2, value3);
          handler(value1, value2, value3);
        }}
        // value={value}
        disabled={disabled}
        hide={hide}
        {...props}
      >
        {name}
      </ActionButton>
    ))}
  </ActionButtonsContainer>
);
