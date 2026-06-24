import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class SelectCategoriesDto {
  @ApiProperty({ type: [String], example: ['viajes', 'trabajo'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  categoryKeys: string[];
}
