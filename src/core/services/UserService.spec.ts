/**
 * @jest-environment jsdom
 */

import { Container } from "@container";

describe('ClientLineService', () => {
  let container: Container;


  beforeAll(() => {
    container = new Container();
  });


  it('Getting UserService should be defined', () => {
    const userService = container.services.userService
    expect(userService).toBeDefined();
  });
});
