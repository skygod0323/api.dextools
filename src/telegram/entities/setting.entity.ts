import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';

import { SoftDelete } from 'src/common/core/soft-delete';

@Entity('setting')
export class Setting extends SoftDelete {
  @Column()
  key: string;

  @Column()
  value: string;

  @Column()
  group: string;
}
