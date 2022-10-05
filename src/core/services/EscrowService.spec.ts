/**
 * @jest-environment jsdom
 */

import { Container } from "@container";

describe('ClientLineService', () => {
  let container: Container;


  beforeAll(() => {
    container = new Container();
  });


  it('Getting EscrowService should be defined', () => {
    const escrowService = container.services.escrowService
    expect(escrowService).toBeDefined();
  });
});
