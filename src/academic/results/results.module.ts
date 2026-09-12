import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ResultsController } from './results.controller.js';
import { ResultsService } from './results.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
