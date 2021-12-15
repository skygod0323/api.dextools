import { ApiProperty } from '@nestjs/swagger';

export class TokenPairDto {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly pair_address: string;

  @ApiProperty()
  readonly token0_address: string;

  @ApiProperty()
  readonly token0_name: string;

  @ApiProperty()
  readonly token0_symbol: string;

  @ApiProperty()
  readonly token1_address: string;

  @ApiProperty()
  readonly token1_name: string;

  @ApiProperty()
  readonly token1_symbol: string;

  @ApiProperty()
  readonly network: string;

  @ApiProperty()
  readonly pool: string;

  @ApiProperty()
  readonly pair_index: number;
}
