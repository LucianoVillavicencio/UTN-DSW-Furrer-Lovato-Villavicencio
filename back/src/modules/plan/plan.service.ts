import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Plan } from './entity/plan.entity';
import { PlanDto } from './dto/plan-dto';

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
            deleted: false,
          },
          {
            name: 'Premium',
            description: 'Nuestro plan más popular con todo lo que necesitás y clases grupales.',
            price: 59,
            numDays: 30,
            deleted: false,
          },
          {
            name: 'Elite',
            description: 'Experiencia fitness definitiva con beneficios premium y entrenamiento personalizado.',
            price: 99,
            numDays: 30,
            deleted: false,
          },
        ];
        await this.planRepository.save(defaultPlans);
      }
    } catch (e) {
      // Table might not be ready during certain migrations/tests
    }
  }

  async createPlan(planDto: PlanDto) {
    const newPlan = this.planRepository.create({
      ...planDto,
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
    return await this.planRepository.save(planDto);
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
