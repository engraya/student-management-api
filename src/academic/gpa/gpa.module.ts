import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { GpaController } from './gpa.controller.js';
import { GpaService } from './gpa.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [GpaController],
  providers: [GpaService],
  exports: [GpaService],
})
export class GpaModule {}
