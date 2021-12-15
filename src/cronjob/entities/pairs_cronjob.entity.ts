import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';

import { SoftDelete } from 'src/common/core/soft-delete';
import { PairsCronjobDto } from '../dtos/pairs_cronjob.dto';

@Entity('pairs_cronjob')
export class PairsCronjob extends SoftDelete {
  @Column()
  network: string;

  @Column()
  pool: string;

  @Column()
  from: number;

  @Column()
  to: number;

  @Column()
  current_index: number;

  @Column()
  active: boolean;

  toPairsCronjobDto(): PairsCronjobDto {
      return {
        id: this.id,
        network: this.network,
        pool: this.pool,
        from: this.from,
        to: this.to,
        current_index: this.current_index,
        active: this.active
      }
  }
}
