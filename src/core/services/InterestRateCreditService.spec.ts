/**
 * @jest-environment jsdom
 */

import { Container } from "@container";

describe('ClientLineService', () => {
  let container: Container;


  beforeAll(() => {
    container = new Container();
  });


  it('Getting InterestRateCreditService should be defined', () => {
    const interestRateCreditService = container.services.interestRateCreditService
    expect(interestRateCreditService).toBeDefined();
  });
});
