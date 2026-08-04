import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  IsEnum,
  IsArray,
} from 'class-validator';
import { BookStatus } from '../../common/book-status.enum';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsOptional()
  @IsInt()
  purchaseYear?: number | null;

  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @IsOptional()
  @IsNumber()
  categoryId?: number | null;

  @IsOptional()
  @IsNumber()
  genreId?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;
}

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  author?: string;

  @IsOptional()
  @IsInt()
  purchaseYear?: number | null;

  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @IsOptional()
  @IsNumber()
  categoryId?: number | null;

  @IsOptional()
  @IsNumber()
  genreId?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;
}

export class BookQueryDto {
  @IsOptional()
  @IsArray()
  categories?: number[];

  @IsOptional()
  @IsArray()
  genres?: number[];

  @IsOptional()
  @IsArray()
  statuses?: string[];

  @IsOptional()
  @IsString()
  search?: string;
}
