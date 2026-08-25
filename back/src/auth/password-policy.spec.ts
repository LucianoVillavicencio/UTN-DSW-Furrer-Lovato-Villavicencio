import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from './dto/register-dto';

describe('RegisterDto password policy', () => {
  it('rejects an eight-character password with no complexity', async () => {
    const dto = plainToInstance(RegisterDto, {
      dni: 30111222,
      email: 'rosa@gmail.com',
      name: 'Rosa',
      surname: 'Gomez',
      password: 'aaaaaaaa',
    });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });

  it('accepts a password with a letter, a digit and eight characters', async () => {
    const dto = plainToInstance(RegisterDto, {
      dni: 30111222,
      email: 'rosa@gmail.com',
      name: 'Rosa',
      surname: 'Gomez',
      password: 'rosa1234',
    });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'password')).toBe(false);
  });
});
