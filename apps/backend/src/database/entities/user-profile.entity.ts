import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  age?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  weight?: number; // kg

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  height?: number; // cm

  @Column({ type: 'enum', enum: ['male', 'female', 'other'], nullable: true })
  gender?: 'male' | 'female' | 'other';

  @Column({ 
    type: 'enum', 
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    nullable: true 
  })
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

  @Column({ type: 'enum', enum: ['lose', 'maintain', 'gain'], nullable: true })
  goal?: 'lose' | 'maintain' | 'gain';

  @Column({ type: 'enum', enum: ['metric', 'imperial'], default: 'metric' })
  units: 'metric' | 'imperial';

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'userId' })
  user: User;
}
