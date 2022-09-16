import { gql } from '@apollo/client';

// FRAGMENTS

// Misc Frags

const TOKEN_FRAGMENT = gql`
  fragment TokenFrag on Token {
    id
    name
    symbol
    decimals
    lastPriceUSD
  }
`;

// Line of Credit Frags

const BASE_LINE_FRAGMENT = gql`
  fragment BaseLineFrag on Line {
    end
    type
    start
    status
    borrower
  }
`;

const LINE_PAGE_CREDIT_FRAGMENT = gql`
  fragment LinePageCreditFrag on Credit {
    lender
    deposit
    principal
    interestRepaid
    interestAccrued
    drawnRate
    token {
      symbol
    }
  }
`;

// lewv = line event with value
const CREDIT_EVENT_FRAGMENT = gql`
  fragment lewv on LineEvent {
    __typename
    amount
    value
  }
  fragment LineEventFrag on LineEvent {
    timestamp
    credit {
      id
    }
    ... on BorrowEvent {
      ...lewv
    }
    ... on DefaultEvent {
      ...lewv
    }
    ... on LiquidateEvent {
      ...lewv
    }
    ... on RepayInterestEvent {
      ...lewv
    }
    ... on AddCollateralEvent {
      ...lewv
    }
    ... on RepayPrincipalEvent {
      ...lewv
    }
    ... on WithdrawProfitEvent {
      ...lewv
    }
    ... on WithdrawDepositEvent {
      ...lewv
    }
    ... on InterestAccruedEvent {
      ...lewv
    }
    ... on RemoveCollateralEvent {
      ...lewv
    }
    ... on SetRatesEvent {
      __typename
      drawnRate
      facilityRate
    }
  }
`;

// Spigot Frags
const BASE_SPIGOT_FRAGMENT = gql`
  fragment BaseSpigotFrag on Spigot {
    active
    contract
    startTime
    token {
      symbol
    }
  }
`;

const SPIGOT_EVENT_FRAGMENT = gql`
  fragment SpigotEventFrag on SpigotEvent {
    ... on ClaimRevenueEvent {
      __typename
      timestamp
      revenueToken {
        symbol
        lastPriceUSD
      }
      escrowed
      netIncome
      value
    }
  }
`;

// Escrow Frags

const ESCROW_FRAGMENT = gql`
  fragment EscrowFrag on Escrow {
    cratio
    minCRatio
    collateralValue
  }
`;

const ESCROW_EVENT_FRAGMENT = gql`
  fragment EscrowEventFrag on EscrowEvent {
    timestamp
    ... on AddCollateralEvent {
      __typename
      amount
      value
    }
    ... on RemoveCollateralEvent {
      __typename
      amount
      value
    }
  }
`;

// QUERIES
// ave to add fragment vars before running your query for frags to be available inside
export const GET_LINE_QUERY = gql`
  ${BASE_LINE_FRAGMENT}
  query getLine($id: ID!) {
    lines(id: $id) {
      ...BaseLineFrag
      escrow {
        id
        collateralValue
      }
      spigot {
        id
      }
    }
  }
`;

export const GET_LINE_PAGE_QUERY = gql`
  ${TOKEN_FRAGMENT}
  ${ESCROW_FRAGMENT}
  ${BASE_LINE_FRAGMENT}
  ${BASE_SPIGOT_FRAGMENT}
  ${CREDIT_EVENT_FRAGMENT}
  ${SPIGOT_EVENT_FRAGMENT}
  ${ESCROW_EVENT_FRAGMENT}
  ${LINE_PAGE_CREDIT_FRAGMENT}

  query getLinePage($id: ID!) {
    lines(id: $id) {
      ...BaseLineFrag

      credits {
        ...LinePageCreditFrag
        events(first: 5) {
          ...CreditEventFrag
        }
      }

      escrow {
        ...EscrowFrag
        deposits {
          timestamp
          amount
          enabled
          token {
            ...TokenFrag
          }
        }
        events(first: 3) {
          ...EscrowEventFrag
        }
      }

      spigot {
        id
        spigots {
          ...BaseSpigotfrag
          events(first: 3) {
            ...SpigotEventFrag
          }
        }
      }
    }
  }
`;

export const GET_LINES_QUERY = gql`
  ${BASE_LINE_FRAGMENT}

  query getLines($first: Int, $orderBy: string, $orderDirection: string) {
    lines(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      ...BaseLineFrag
      escrow {
        id
        collateralValue
      }
      spigot {
        id
      }
    }
  }
`;

export const GET_SPIGOT_QUERY = gql`
  ${BASE_SPIGOT_FRAGMENT}

  query getSpigot($id: ID!) {
    ...BaseSpigotFrag
  }
`; // to get total outstanding debt we need
