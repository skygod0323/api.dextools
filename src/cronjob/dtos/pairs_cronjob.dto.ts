import { ApiProperty } from '@nestjs/swagger';

export class PairsCronjobDto {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly network: string;

  @ApiProperty()
  readonly pool: string;

  @ApiProperty()
  readonly from: number;

  @ApiProperty()
  readonly to: number;

  @ApiProperty()
  readonly current_index: number;

  @ApiProperty()
  readonly active: boolean;
}
