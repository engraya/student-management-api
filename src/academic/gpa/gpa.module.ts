import { Module } from '@nestjs/common';
import { GpaController } from './gpa.controller.js';
import { GpaService } from './gpa.service.js';

@Module({
  controllers: [GpaController],
  providers: [GpaService],
  exports: [GpaService],
})
export class GpaModule {}
