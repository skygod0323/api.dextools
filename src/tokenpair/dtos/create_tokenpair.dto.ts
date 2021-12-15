import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTokenPairDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pair_address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token0_address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token0_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token0_symbol: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token1_address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token1_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token1_symbol: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  network: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pool: string;

  @ApiProperty()
  @IsString()
  pair_index: number;
}
