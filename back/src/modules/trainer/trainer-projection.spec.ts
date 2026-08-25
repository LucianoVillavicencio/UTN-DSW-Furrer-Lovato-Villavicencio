import { publicTrainerSelect } from './trainer.service';

describe('publicTrainerSelect', () => {
  it('includes only the columns the public trainer card renders', () => {
    expect(publicTrainerSelect).toEqual({
      dni: true,
      name: true,
      surname: true,
      speciality: true,
      instagram: true,
      certifications: true,
      workSchedule: true,
      photoUrl: true,
    });
  });

  it('excludes contact information', () => {
    expect(publicTrainerSelect).not.toHaveProperty('email');
    expect(publicTrainerSelect).not.toHaveProperty('phone');
  });
});
