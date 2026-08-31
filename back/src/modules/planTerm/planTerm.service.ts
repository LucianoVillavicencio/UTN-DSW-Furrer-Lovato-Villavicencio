import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { PlanTerm } from './entity/planTerm.entity';
import { PlanTermDto } from './dto/planTerm-dto';
import { PlanService } from '../plan/plan.service';

// Every plan tops out at a year of prepay; a longer term is not a discount
// tier this gym offers.
const MAX_MONTHS = 12;

@Injectable()
export class PlanTermService {
  constructor(
    @InjectRepository(PlanTerm)
    private planTermRepository: Repository<PlanTerm>,
    private readonly planService: PlanService,
  ) {}

  private assertMonthsWithinCap(months: number) {
    if (months > MAX_MONTHS) {
      throw new ConflictException('El plazo máximo es de 12 meses.');
    }
  }

  async createTerm(planTermDto: PlanTermDto) {
    const plan = await this.planService.findPlan(planTermDto.planId);
    if (!plan || plan.deleted) {
      throw new NotFoundException(
        `El plan con ID: ${planTermDto.planId} no existe.`,
      );
    }
    this.assertMonthsWithinCap(planTermDto.months);

    const newTerm = this.planTermRepository.create({
      ...planTermDto,
      deleted: planTermDto.deleted ?? false,
    });
    return await this.planTermRepository.save(newTerm);
  }

  async findTerm(id: number) {
    return await this.planTermRepository.findOne({ where: { id } });
  }

  // Non-deleted terms for a plan, shortest (and usually cheapest) first —
  // used both by the public "choose a term" picker and by changePlan's
  // 1-month fallback.
  async findForPlan(planId: number) {
    return await this.planTermRepository.find({
      where: { planId, deleted: false },
      order: { months: 'ASC' },
    });
  }

  async findAll() {
    return await this.planTermRepository.find({ where: { deleted: false } });
  }

  async findAllDeleted() {
    return await this.planTermRepository.find({ where: { deleted: true } });
  }

  async updateTerm(planTermDto: PlanTermDto) {
    if (!planTermDto.id) {
      throw new ConflictException(
        'El ID del plazo es obligatorio para actualizar.',
      );
    }
    const exists = await this.findTerm(planTermDto.id);
    if (!exists) {
      throw new NotFoundException(
        `El plazo con ID: ${planTermDto.id} no existe.`,
      );
    }
    this.assertMonthsWithinCap(planTermDto.months);

    return await this.planTermRepository.save({
      ...planTermDto,
      deleted: planTermDto.deleted ?? exists.deleted,
    });
  }

  async deleteTerm(id: number) {
    const exists = await this.findTerm(id);
    if (!exists) {
      throw new NotFoundException(`El plazo con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`El plazo ya está eliminado.`);
    }
    const rows: UpdateResult = await this.planTermRepository.update(
      { id },
      { deleted: true },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar el plazo`);
    }

    return { message: `Eliminado correctamente` };
  }

  async restoreTerm(id: number) {
    const exists = await this.findTerm(id);
    if (!exists) {
      throw new NotFoundException(`El plazo con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`El plazo no está borrado.`);
    }
    const rows: UpdateResult = await this.planTermRepository.update(
      { id },
      { deleted: false },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo restaurar el plazo`);
    }

    return { message: `Restaurado correctamente` };
  }
}
