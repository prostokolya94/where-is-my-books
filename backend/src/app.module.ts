import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { CategoriesModule } from './categories/categories.module';
import { GenresModule } from './genres/genres.module';
import { BooksModule } from './books/books.module';
import { TabsModule } from './tabs/tabs.module';
import { StatsModule } from './stats/stats.module';
import { PlansModule } from './plans/plans.module';
import { UnreadModule } from './unread/unread.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(process.cwd(), 'data', 'books.sqlite'),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      autoLoadEntities: true,
    }),
    CategoriesModule,
    GenresModule,
    BooksModule,
    TabsModule,
    StatsModule,
    PlansModule,
    UnreadModule,
  ],
})
export class AppModule {}
