import styled from 'styled-components';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import { useAppSelector, useAppDispatch } from '@hooks';
import { ModalsActions, ModalSelectors } from '@store';

import { TestModal } from './TestModal';
import { ComingSoonModal } from './ComingSoonModal';
import { CommunityThemesModal } from './CommunityThemesModal';
import { TestTxModal } from './TestTxModal';
import { AddCreditPositionTxModal } from './AddCreditPositionTxModal';
import { EnableCollateralAssetTxModal } from './EnableCollateralAssetTxModal';
import { MigrateTxModal } from './MigrateTxModal';
import { LiquidateBorrowerTxModal } from './LiquidateBorrower';
import { BorrowTxModal } from './BorrowTxModal';
import { DeployLineTxModal } from './DeployLineTxModal';
import { RepayPositionTxModal } from './RepayPositionTxModal';
import { WithdrawCreditTxModal } from './WithdrawCreditTxModal';
import { AddCollateralTxModal } from './AddCollateralTxModal';
import { EnableSpigotTxModal } from './EnableSpigotTxModal';

const modalTimeout = 300;

const StyledModals = styled(TransitionGroup)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: ${({ theme }) => theme.zindex.modals};

  .slideBottom-enter {
    opacity: 0;
    transform: translate3d(0, 100vh, 0);
    transition: opacity ${modalTimeout}ms ease, transform ${modalTimeout}ms ease;
  }
  .slideBottom-enter-active {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  .slideBottom-exit-active {
    opacity: 0;
    transform: translate3d(0, 100vh, 0);
    transition: opacity ${modalTimeout}ms ease, transform ${modalTimeout}ms cubic-bezier(1, 0.5, 0.8, 1);
  }

  .opacity-enter {
    opacity: 0;
    transition: opacity ${modalTimeout}ms ease-in-out;
  }
  .opacity-enter-active {
    opacity: 1;
  }
  .opacity-exit-active {
    opacity: 0;
    transition: opacity ${modalTimeout}ms ease-in-out;
  }
`;

const StyledBackdrop = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  pointer-events: all;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 0;

  @media (min-width: ${({ theme }) => theme.devices.tablet}px) {
    backdrop-filter: blur(11px);
  }
`;

// TODO dynamic modals list
// This will fix the development warning for strict mode if we apply nodeRef like
// in alerts
// const MODALS = [
//   {
//     name: 'test',
//     component: TestModal,
//   },
// ];

interface BackdropProps {
  onClick?: () => void;
}

export const Backdrop = ({ onClick }: BackdropProps) => {
  return <StyledBackdrop data-testid="active-modal-backdrop" onClick={onClick} />;
};

export const Modals = () => {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector(ModalSelectors.selectActiveModal);
  const modalProps = useAppSelector(ModalSelectors.selectActiveModalProps);

  const closeModal = () => dispatch(ModalsActions.closeModal());

  let backdrop;

  if (activeModal) {
    backdrop = <Backdrop onClick={closeModal} />;
  }

  return (
    <StyledModals data-testid="modals-container">
      {/* //////////////////////////// MODALS ///////////////////////////// */}

      {activeModal === 'test' && (
        <CSSTransition key={'test'} timeout={modalTimeout} classNames="slideBottom">
          <TestModal modalProps={modalProps} onClose={closeModal} />
        </CSSTransition>
      )}
      {activeModal === 'comingSoon' && (
        <CSSTransition key={'comingSoon'} timeout={modalTimeout} classNames="slideBottom">
          <ComingSoonModal modalProps={modalProps} onClose={closeModal} />
        </CSSTransition>
      )}

      {activeModal === 'testTx' && (
        <CSSTransition key={'testTx'} timeout={modalTimeout} classNames="slideBottom">
          <TestTxModal onClose={closeModal} />
        </CSSTransition>
      )}

      {activeModal === 'migrateTx' && (
        <CSSTransition key={'migrateTx'} timeout={modalTimeout} classNames="slideBottom">
          <MigrateTxModal onClose={closeModal} />
        </CSSTransition>
      )}

      {activeModal === 'communityThemes' && (
        <CSSTransition key={'communityThemes'} timeout={modalTimeout} classNames="slideBottom">
          <CommunityThemesModal onClose={closeModal} />
        </CSSTransition>
      )}

      {activeModal === 'addPosition' && (
        <CSSTransition key={'addPosition'} timeout={modalTimeout} classNames="slideBottom">
          <AddCreditPositionTxModal onClose={closeModal} />
        </CSSTransition>
      )}

      {activeModal === 'liquidateBorrower' && (
        <CSSTransition key={'liquidateBorrower'} timeout={modalTimeout} classNames="slideBottom">
          <LiquidateBorrowerTxModal onClose={closeModal} />
        </CSSTransition>
      )}
      {activeModal === 'createLine' && (
        <CSSTransition key={'createLine'} timeout={modalTimeout} classNames="slideBottom">
          <DeployLineTxModal onClose={closeModal} />
        </CSSTransition>
      )}

      {activeModal === 'borrow' && (
        <CSSTransition key={'borrow'} timeout={modalTimeout} classNames="slideBottom">
          <BorrowTxModal onClose={closeModal} />
        </CSSTransition>
      )}

      {activeModal === 'depositAndRepay' && (
        <CSSTransition key={'depositAndRepay'} timeout={modalTimeout} classNames="slideBottom">
          <RepayPositionTxModal onClose={closeModal} />
        </CSSTransition>
      )}

      {activeModal === 'withdraw' && (
        <CSSTransition key={'withdraw'} timeout={modalTimeout} classNames="slideBottom">
          <WithdrawCreditTxModal onClose={closeModal} />
        </CSSTransition>
      )}

      {activeModal === 'addCollateral' && (
        <CSSTransition key={'addCollateral'} timeout={modalTimeout} classNames="slideBottom">
          <AddCollateralTxModal onClose={closeModal} />
        </CSSTransition>
      )}

      {activeModal === 'enableCollateral' && (
        <CSSTransition key={'enableCollateral'} timeout={modalTimeout} classNames="slideBottom">
          <EnableCollateralAssetTxModal onClose={closeModal} />
        </CSSTransition>
      )}

      {activeModal === 'enableSpigot' && (
        <CSSTransition key={'enableSpigot'} timeout={modalTimeout} classNames="slideBottom">
          <EnableSpigotTxModal onClose={closeModal} />
        </CSSTransition>
      )}

      {/* //////////////////////////// BACKDROP ///////////////////////////// */}

      {backdrop && (
        <CSSTransition key={'backdrop'} timeout={modalTimeout} classNames="opacity">
          {backdrop}
        </CSSTransition>
      )}
    </StyledModals>
  );
};
