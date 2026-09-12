import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { GpaController } from './gpa.controller.js';
import { GpaService } from './gpa.service.js';

describe('GpaController', () => {
  let controller: GpaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GpaController],
      providers: [{ provide: GpaService, useValue: {} }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GpaController>(GpaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
