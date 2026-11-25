// Test Unitario: prueba la función pura `resolveTerm` de forma totalmente aislada
// (sin base de datos ni servidor), validando las reglas de negocio de precios y duraciones.

import { NotFoundException } from '@nestjs/common';
import { Plan } from './entity/plan.entity';
import { PlanDuration } from './entity/plan-duration.entity';
import { resolveTerm } from './plan-duration.rules';

// Datos ficticios en memoria (Arrange): simulamos un plan base "Premium" de 1 mes ($59, 30 días).
const plan = { id: 2, name: 'Premium', price: 59, numDays: 30 } as Plan;

// Función auxiliar para generar duraciones extendidas simuladas (por defecto 6 meses a $300).
const duration = (over: Partial<PlanDuration>): PlanDuration =>
  ({
    id: 1,
    planId: 2,
    months: 6,
    numDays: 180,
    price: 300,
    deleted: false,
    ...over,
  }) as PlanDuration;

describe('resolveTerm', () => {
  // Caso 1 (Éxito): para 1 mes, debe tomar el precio y días directamente del plan base (sin duración extra).
  it('reads the plan itself for one month', () => {
    expect(resolveTerm(plan, 1, [])).toEqual({
      months: 1,
      numDays: 30,
      price: 59,
      planDurationId: null,
    });
  });

  it('reads the matching duration for six months', () => {
    // Caso 2 (Éxito): para 6 meses, busca en la lista y devuelve la duración promocional correspondiente.
    expect(resolveTerm(plan, 6, [duration({ id: 7 })])).toEqual({
      months: 6,
      numDays: 180,
      price: 300,
      planDurationId: 7,
    });
  });

  it('refuses a duration the plan does not offer', () => {
    // Caso 3 (Error): si se pide 12 meses pero el plan no ofrece esa duración, lanza NotFoundException (404).
    expect(() => resolveTerm(plan, 12, [duration({})])).toThrow(
      NotFoundException,
    );
  });

  it('does not match a deleted duration', () => {
    // Caso 4 (Error): si la duración existe pero fue eliminada (soft-delete), también la rechaza con 404.
    expect(() => resolveTerm(plan, 6, [duration({ deleted: true })])).toThrow(
      NotFoundException,
    );
  });

  it('never satisfies one month from a duration row', () => {
    // Caso 5 (Consistencia): aunque exista una fila manual de 1 mes, siempre prevalece el precio del plan base.
    const rogue = duration({ months: 1, numDays: 45, price: 10 });
    expect(resolveTerm(plan, 1, [rogue]).price).toBe(59);
  });

  it('refuses a months value that is not 1, 3, 6 or 12', () => {
    // Caso 6 (Validación): rechaza cantidades de meses no permitidas (como 4 meses).
    expect(() => resolveTerm(plan, 4, [])).toThrow(NotFoundException);
  });

  it('coerces a DECIMAL price that arrived from mysql2 as a string', () => {
    // Caso 7 (Tipos de MySQL): mysql2 devuelve los campos DECIMAL como string ('59.00');
    // verifica que la función lo convierta a número (59) para no romper cálculos.
    const stringPriced = { ...plan, price: '59.00' } as unknown as Plan;
    expect(resolveTerm(stringPriced, 1, []).price).toBe(59);
  });
});
