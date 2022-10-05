/**
 * @jest-environment jsdom
 */

import { Container } from "@container";

describe('ClientLineService', () => {
  let container: Container;


  beforeAll(() => {
    container = new Container();
  });


  it('Getting GasService should be defined', () => {
    const gasService = container.services.gasService
    expect(gasService).toBeDefined();
  });
});
