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

const LINE_PAGE_CREDIT_FRAGMENT = `
  fragment LinePageCreditFrag on Credit {
    lender, 
    deposit,
    principal,
    interestRepaid,
    interestAccrued,
    drawnRate,
    token { symbol, lastPriceUsd },
  }
`;

// lewv = line event with value
const CREDIT_EVENT_FRAGMENT = `
    fragment lewv on LineEvent { __typename, amount, value }
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
        __typename,
        drawnRate,
        facilityRate,
      },
    }
`;

// Spigot Frags
const SPIGOT_EVENT_FRAGMENT = `
    fragment SpigotEventFrag on SpigotEvent {
      ...on ClaimRevenueEvent {
        __typename,
        timestamp,
        revenueToken { symbol, lastPriceUsd },
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
      ...on AddCollateralEvent    { __typename, amount, value, }
      ...on RemoveCollateralEvent { __typename, amount, value, }
    }
`;

// QUERIES
// ave to add fragment vars before running your query for frags to be available inside
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
  ${CREDIT_EVENT_FRAGMENT}
  ${SPIGOT_EVENT_FRAGMENT}
  ${ESCROW_EVENT_FRAGMENT}
  ${LINE_PAGE_CREDIT_FRAGMENT}

  query getLinePage(id: $id) {
    lines(id: $id) {
      ...BaseLineFrag,

      credits {
        ...LinePageCreditFrag 
        events(first: 5)   { ...CreditEventFrag }
      }
      
      escrow {
        ...EscrowFrag,
        deposits {
          timestamp,
          amount,
          enabled,
          token            { ...TokenFrag }, 
        },
        events(first: 3)   { ...EscrowEventFrag }
      }

      spigot {
        id
        spigots {
          active,
          contract,
          startTime,
          token             { symbol, lastPriceUSD},
          events(first: 3)  { ...SpigotEventFrag }
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
