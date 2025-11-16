import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { ProgressRepository } from './repository/progress.repository';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ProgressController],
  providers: [ProgressService, ProgressRepository],
  exports: [ProgressRepository],
})
export class ProgressModule {}
