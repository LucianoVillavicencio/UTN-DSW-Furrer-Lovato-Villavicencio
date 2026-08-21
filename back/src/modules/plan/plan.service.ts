import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Plan, PlanFeature } from './entity/plan.entity';
import { PlanDto } from './dto/plan-dto';

// Los mismos tres sets que antes vivían hardcodeados en el front
// (plans.data.ts), adivinados a partir del NOMBRE del plan — se portan acá
// para usarlos como contenido por defecto al: 1) sembrar los 3 planes base
// en una base vacía, y 2) rellenar planes que ya existían antes de que
// `features` existiera como columna (ver backfillMissingFeatures).
const BASIC_FEATURES: PlanFeature[] = [
  { label: 'Acceso 24/7 al gimnasio', available: true },
  { label: 'Cardio y equipamiento de fuerza', available: true },
  { label: 'Acceso a vestuarios', available: true },
  { label: 'Evaluación física inicial gratis', available: true },
  { label: 'Clases grupales', available: false },
  { label: 'Entrenador personal dedicado', available: false },
];

const PREMIUM_FEATURES: PlanFeature[] = [
  { label: 'Acceso 24/7 al gimnasio', available: true },
  { label: 'Cardio y equipamiento de fuerza', available: true },
  { label: 'Clases grupales incluidas', available: true },
  { label: '2 sesiones con entrenador personal/mes', available: true },
  { label: 'Seguimiento nutricional', available: true },
  { label: 'Entrenamiento personal diario', available: false },
];

const ELITE_FEATURES: PlanFeature[] = [
  { label: 'Acceso ilimitado 24/7 a todas las áreas', available: true },
  { label: 'Todas las clases grupales ilimitadas', available: true },
  { label: 'Entrenamiento personal ilimitado', available: true },
  { label: 'Coaching nutricional personalizado', available: true },
  { label: 'Acceso prioritario a turnos de clases', available: true },
  { label: 'Locker premium y servicio de toallas', available: true },
];

function guessDefaultFeatures(name: string): PlanFeature[] {
  const normName = (name || '').toLowerCase();
  const isElite =
    normName.includes('elite') || normName.includes('vip') || normName.includes('pro');
  const isBasic = normName.includes('básico') || normName.includes('basico');

  if (isElite) return ELITE_FEATURES;
  if (isBasic) return BASIC_FEATURES;
  return PREMIUM_FEATURES;
}

@Injectable()
export class PlanService implements OnModuleInit {
  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.planRepository.count();
      if (count === 0) {
        const defaultPlans = [
          {
            name: 'Básico',
            description: 'Perfecto para empezar tu camino fitness. Acceso al gimnasio y área de cardio.',
            price: 29,
            numDays: 30,
            features: BASIC_FEATURES,
            deleted: false,
          },
          {
            name: 'Premium',
            description: 'Nuestro plan más popular con todo lo que necesitás y clases grupales.',
            price: 59,
            numDays: 30,
            features: PREMIUM_FEATURES,
            deleted: false,
          },
          {
            name: 'Elite',
            description: 'Experiencia fitness definitiva con beneficios premium y entrenamiento personalizado.',
            price: 99,
            numDays: 30,
            features: ELITE_FEATURES,
            deleted: false,
          },
        ];
        await this.planRepository.save(defaultPlans);
      } else {
        await this.backfillMissingFeatures();
      }
    } catch (e) {
      // Table might not be ready during certain migrations/tests
    }
  }

  // Rellena con un set por defecto (adivinado por nombre, ver arriba) los
  // planes que ya existían antes de que `features` fuera una columna real
  // — sin esto quedarían con `null` y la página de planes se vería vacía
  // hasta que un admin entre a cargarlos a mano.
  private async backfillMissingFeatures() {
    const plansWithoutFeatures = await this.planRepository
      .createQueryBuilder('plan')
      .where('plan.features IS NULL')
      .getMany();

    for (const plan of plansWithoutFeatures) {
      plan.features = guessDefaultFeatures(plan.name);
      await this.planRepository.save(plan);
    }
  }

  async createPlan(planDto: PlanDto) {
    const newPlan = this.planRepository.create({
      ...planDto,
      features: planDto.features ?? guessDefaultFeatures(planDto.name),
      deleted: planDto.deleted ?? false,
    });
    return await this.planRepository.save(newPlan);
  }

  async findPlan(id: number) {
    return await this.planRepository.findOne({ where: { id } });
  }

  async findAll() {
    return await this.planRepository.find({ where: { deleted: false } });
  }

  async findAllDeleted() {
    return await this.planRepository.find({ where: { deleted: true } });
  }

  async updatePlan(planDto: PlanDto) {
    if (!planDto.id) {
      throw new ConflictException(
        'El ID del plan es obligatorio para actualizar.',
      );
    }
    const exists = await this.findPlan(planDto.id);
    if (!exists) {
      throw new NotFoundException(`El plan con ID: ${planDto.id} no existe.`);
    }
    return await this.planRepository.save({
      ...planDto,
      // Si no mandan features en este update puntual, no las borramos.
      features: planDto.features ?? exists.features,
    });
  }

  async deletePlan(id: number) {
    const exists = await this.findPlan(id);
    if (!exists) {
      throw new NotFoundException(`El plan con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`El plan ya está eliminado.`);
    }
    const rows: UpdateResult = await this.planRepository.update(
      { id },
      { deleted: true },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar el plan`);
    }

    return { message: `Eliminado correctamente` };
  }

  async restorePlan(id: number) {
    const exists = await this.findPlan(id);
    if (!exists) {
      throw new NotFoundException(`El plan con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`El plan no está borrado.`);
    }
    const rows: UpdateResult = await this.planRepository.update(
      { id },
      { deleted: false },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo restaurar el plan`);
    }

    return { message: `Restaurado correctamente` };
  }
}
