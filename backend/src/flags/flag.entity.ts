import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('app_flags')
export class AppFlag {
  @PrimaryColumn()
  name: string;

  @Column()
  label: string;

  @Column({ default: true })
  enabled: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}