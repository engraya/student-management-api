import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FacultiesController } from './faculties.controller.js';
import { FacultiesService } from './faculties.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [FacultiesController],
  providers: [FacultiesService],
  exports: [FacultiesService],
})
export class FacultiesModule {}
