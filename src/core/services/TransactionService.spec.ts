/**
 * @jest-environment jsdom
 */

import { Container } from "@container";

describe('ClientLineService', () => {
  let container: Container;


  beforeAll(() => {
    container = new Container();
  });


  it('Getting TransactionService should be defined', () => {
    const transactionService = container.services.transactionService
    expect(transactionService).toBeDefined();
  });
});
