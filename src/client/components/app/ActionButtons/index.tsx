import styled from 'styled-components';

import { Button, Icon, WarningFilledIcon } from '@components/common';

const ActionButtonsContainer = styled.div<{ actions: number }>`
  display: flex;
  align-items: center;
  // grid-template-columns: repeat(${({ actions }) => actions}, 1fr);
  gap: ${({ theme }) => theme.layoutPadding};
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
  // width: 9.6rem;

  ${({ hide }) => hide && `visibility: hidden;`}

  &[disabled],
  &.disabled {
    opacity: 0.6;
  }
`;

interface ActionButtonsProps {
  actions: Array<{
    name: string;
    // handler: (value?: string) => void;
    handler: (value1?: string, value2?: string) => void;
    disabled?: boolean;
    hide?: boolean;
  }>;
  value1?: string;
  value2?: string;
  alert?: string;
}

export const ActionButtons = ({ actions, alert, value1, value2 }: ActionButtonsProps) => (
  <ActionButtonsContainer actions={actions.length}>
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
          handler(value1, value2);
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
