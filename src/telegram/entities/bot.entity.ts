import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';

import { SoftDelete } from 'src/common/core/soft-delete';

@Entity('bots')
export class Bot extends SoftDelete {
  @Column()
  network: string;

  @Column()
  name: string;

  @Column()
  symbol: string;

  @Column()
  address: string;

  @Column()
  group: string;

  @Column()
  price: string;

  @Column()
  csupply: string;

  @Column()
  supply: string;
}
