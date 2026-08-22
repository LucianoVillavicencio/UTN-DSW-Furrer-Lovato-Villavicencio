import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';
import { TIME_PATTERN } from '../../classSession/dto/classSession-dto';

// What a member picks: a class and an hour. The weekly turnos behind it — one
// per weekday the class runs at that hour — are resolved by the backend, and
// the member's DNI comes from the JWT, never from the body.
export class EnrollClassDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  classId!: number;

  @Matches(TIME_PATTERN, {
    message: 'La hora tiene que tener el formato HH:MM.',
  })
  startTime!: string;
}

// Switching class or hour. `group` says which enrollment is being replaced,
// which only matters on a plan that allows more than one class at a time; with
// a single active enrollment it can be left out.
export class ChangeEnrollmentDto extends EnrollClassDto {
  @IsString()
  @IsOptional()
  group?: string;
}
