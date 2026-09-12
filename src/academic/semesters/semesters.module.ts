import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SemestersController } from './semesters.controller.js';
import { SemestersService } from './semesters.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [SemestersController],
  providers: [SemestersService],
  exports: [SemestersService],
})
export class SemestersModule {}
