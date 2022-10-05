/**
 * @jest-environment jsdom
 */

import { Container } from "@container";

describe('ClientLineService', () => {
  let container: Container;


  beforeAll(() => {
    container = new Container();
  });


  it('Getting VaultService should be defined', () => {
    const vaultService = container.services.vaultService
    expect(vaultService).toBeDefined();
  });
});
