import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';

import { SoftDelete } from 'src/common/core/soft-delete';
import { TokenPairDto } from '../dtos/tokenpair.dto';

@Entity('token_pairs')
export class TokenPair extends SoftDelete {
  @Column()
  pair_address: string;

  @Column()
  token0_address: string;

  @Column()
  token0_symbol: string;

  @Column()
  token0_name: string;

  @Column()
  token1_address: string;

  @Column()
  token1_symbol: string;

  @Column()
  token1_name: string;

  @Column()
  network: string;

  @Column()
  pool: string;

  @Column()
  pair_index: number

  toTokenPairDto(): TokenPairDto {
    return {
      id: this.id,
      pair_address: this.pair_address,
      token0_address: this.token0_address,
      token0_symbol: this.token0_symbol,
      token0_name: this.token0_name,
      token1_address: this.token1_address,
      token1_symbol: this.token1_symbol,
      token1_name: this.token1_name,
      network: this.token1_symbol,
      pool: this.token1_name,
      pair_index: this.pair_index
    };
  }
}
