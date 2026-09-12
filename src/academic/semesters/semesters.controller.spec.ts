import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { SemestersController } from './semesters.controller.js';
import { SemestersService } from './semesters.service.js';

describe('SemestersController', () => {
  let controller: SemestersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SemestersController],
      providers: [{ provide: SemestersService, useValue: {} }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SemestersController>(SemestersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
