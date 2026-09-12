import { Test, TestingModule } from '@nestjs/testing';
import { GpaController } from './gpa.controller.js';

describe('GpaController', () => {
  let controller: GpaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GpaController],
    }).compile();

    controller = module.get<GpaController>(GpaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
