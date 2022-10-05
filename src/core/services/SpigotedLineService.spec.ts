/**
 * @jest-environment jsdom
 */

import { Container } from "@container";

describe('ClientLineService', () => {
  let container: Container;


  beforeAll(() => {
    container = new Container();
  });


  it('Getting SpigotedLineService should be defined', () => {
    const spigotedLineService = container.services.spigotedLineService
    expect(spigotedLineService).toBeDefined();
  });
});
