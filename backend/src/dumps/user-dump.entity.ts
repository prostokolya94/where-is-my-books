import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_dumps')
export class UserDump {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  userId: number;

  @Column()
  name: string;

  @Column({ type: 'integer', default: 0 })
  size: number;

  @Column({ type: 'varchar', default: 'server' })
  source: 'server' | 'upload';

  @Column({ type: 'bytea', nullable: true })
  data: Buffer | null;

  @CreateDateColumn()
  createdAt: Date;
}