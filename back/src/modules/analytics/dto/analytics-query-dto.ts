import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AnalyticsQueryDto {
  // Declared here even though OwnerPasswordGuard reads it from the raw body:
  // forbidNonWhitelisted would otherwise reject the request with a 400 before
  // the guard ever ran. It travels in the BODY and never in the query string —
  // SecurityLogInterceptor writes request.url to the application log.
  @IsString()
  @IsNotEmpty()
  ownerPassword!: string;

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @IsIn(['day', 'month'])
  @IsOptional()
  granularity?: 'day' | 'month';
}
