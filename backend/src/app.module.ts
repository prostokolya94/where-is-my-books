import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CategoriesModule } from './categories/categories.module';
import { GenresModule } from './genres/genres.module';
import { BooksModule } from './books/books.module';
import { TabsModule } from './tabs/tabs.module';
import { StatsModule } from './stats/stats.module';
import { PlansModule } from './plans/plans.module';
import { UnreadModule } from './unread/unread.module';
import { ReadModule } from './read/read.module';
import { CostsModule } from './costs/costs.module';
import { DumpsModule } from './dumps/dumps.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { EventsModule } from './events/events.module';
import { MailModule } from './mail/mail.module';
import { FlagsModule } from './flags/flags.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 60,
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'books',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: (process.env.DB_SYNC || 'false').toLowerCase() === 'true',
      autoLoadEntities: true,
    }),
    AuthModule,
    AdminModule,
    EventsModule,
    MailModule,
    FlagsModule,
    CategoriesModule,
    GenresModule,
    BooksModule,
    TabsModule,
    StatsModule,
    PlansModule,
    UnreadModule,
    ReadModule,
    CostsModule,
    DumpsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
