import { gql } from '@apollo/client';

// FRAGMENTS

// Misc Frags

const TOKEN_FRAGMENT = `
  fragment TokenFrag on Token {
    id, name, symbol, decimals, lastPriceUSD
  }
`;

// Line of Credit Frags

const BASE_LINE_FRAGMENT = `
  fragment BaseLineFrag on Line {
    end, type, start, status, borrower,
  }
`;

// lewv = line event with value
const LINE_EVENT_FRAGMENT = `
    fragment lewv on LineEvent { amount, value }
    fragment LineEventFrag on LineEvent {
      timestamp,
      credit { id },
      ...on BorrowEvent               { ...lewv },
      ...on DefaultEvent              { ...lewv },
      ...on LiquidateEvent            { ...lewv },
      ...on RepayInterestEvent        { ...lewv },
      ...on AddCollateralEvent        { ...lewv },
      ...on RepayPrincipalEvent       { ...lewv },
      ...on WithdrawProfitEvent       { ...lewv },
      ...on WithdrawDepositEvent      { ...lewv },
      ...on InterestAccruedEvent      { ...lewv },
      ...on RemoveCollateralEvent     { ...lewv },
      ...on SetRatesEvent {
        drawnRate,
        facilityRate,
      },
    }
`;

// Spigot Frags
const SPIGOT_EVENT_FRAGMENT = `
    fragment SpigotEventFrag on SpigotEvent {
      ...on ClaimRevenueEvent {
        timestamp,
        revenueToken { id },
        escrowed,
        netIncome,
        value,
      }
    }
`;

// Escrow Frags

const ESCROW_FRAGMENT = `
  fragment EscrowFrag on Escrow {
    cratio, minCRatio, collateralValue,
  }
`;

const ESCROW_EVENT_FRAGMENT = `
    fragment EscrowEventFrag on EscrowEvent {
      timestamp,
      ...on AddCollateralEvent    { amount, value,  }
      ...on RemoveCollateralEvent { amount, value, }
    }
`;

// QUERIES
export const GET_LINE_QUERY = `
  ${BASE_LINE_FRAGMENT}
  query getLine(id: $id) {
    lines(id: $id) {
      ...BaseLineFrag,
      escrow { id, collateralValue }
      spigot { id }
    }
  }
`;

export const GET_LINE_PAGE_QUERY = `
  ${TOKEN_FRAGMENT}
  ${ESCROW_FRAGMENT}
  ${BASE_LINE_FRAGMENT}
  ${LINE_EVENT_FRAGMENT}
  ${SPIGOT_EVENT_FRAGMENT}
  ${ESCROW_EVENT_FRAGMENT}

  query getLinePage(id: $id) {
    lines(id: $id) {
      ...BaseLineFrag,
      events(first: 10)     { ...LineEventFrag },
      
      escrow {
        ...EscrowFrag,
        deposits {
          amount,
          enabled,
          token             { ...TokenFrag }, 
        },
        events(first: 10)   { ...EscrowEventFrag }
      }

      spigot {
        id
        spigots {
          active,
          contract,
          startTime,
          ownerSplit,
          token             { ...TokenFrag },
          events(first: 10) { ...SpigotEventFrag }
        }
      }
    }
  }
`;

export const GET_LINES_QUERY = `
  ${BASE_LINE_FRAGMENT}
  query getLines(
    first: $first, 
    orderBy: $orderBy, 
    orderDirection: $orderDirection
  ) {
    lines(
      first: $first,
      orderBy: $orderBy,
      orderDirection: $orderDirection
    )  {
      ...BaseLineFrag,
      escrow { id. collateralValue }
      spigot { id }
    }
  }
`;

// export const GET_SPIGOT_QUERY = `
//   ${BASE_LINE_FRAGMENT}
//   query getLines(
//     first: $first,
//     orderBy: $orderBy,
//     orderDirection: $orderDirection
//   ) {
//     lines(
//       first: $first,
//       orderBy: $orderBy,
//       orderDirection: $orderDirection
//     )  {
//       ...BaseLineFrag
//       escrow { id. collateralValue }
//       spigot { id }
//     }
//   }
// `; // to get total outstanding debt we need
