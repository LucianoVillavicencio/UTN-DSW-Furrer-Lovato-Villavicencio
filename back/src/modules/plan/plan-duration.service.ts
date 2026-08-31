import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanDuration } from './entity/plan-duration.entity';
import { PlanDurationDto } from './dto/plan-duration-dto';
import { PlanService } from './plan.service';

// A sibling of PlanService rather than more methods on it: that file is
// already half seed content. A sibling rather than its own module because a
// duration has no lifecycle independent of a plan, and a separate module would
// force PaymentModule to import two modules to price one sale.
@Injectable()
export class PlanDurationService {
  constructor(
    @InjectRepository(PlanDuration)
    private readonly durationRepository: Repository<PlanDuration>,
    private readonly planService: PlanService,
  ) {}

  async findByPlan(planId: number): Promise<PlanDuration[]> {
    return this.durationRepository.find({
      where: { planId, deleted: false },
      order: { months: 'ASC' },
    });
  }

  private async requirePlan(planId: number) {
    const plan = await this.planService.findPlan(planId);
    if (!plan) {
      throw new NotFoundException(`El plan con ID: ${planId} no existe.`);
    }
    return plan;
  }

  async create(planId: number, dto: PlanDurationDto): Promise<PlanDuration> {
    await this.requirePlan(planId);

    const existing = await this.durationRepository.findOne({
      where: { planId, months: dto.months },
    });

    if (existing && !existing.deleted) {
      throw new ConflictException(
        `El plan ya tiene un precio para ${dto.months} meses.`,
      );
    }

    // The unique index counts soft-deleted rows, so re-adding a duration that
    // was retired has to revive the old row rather than insert beside it.
    if (existing) {
      existing.deleted = false;
      existing.numDays = dto.numDays;
      existing.price = dto.price;
      return this.durationRepository.save(existing);
    }

    return this.durationRepository.save(
      this.durationRepository.create({ planId, ...dto, deleted: false }),
    );
  }

  private async requireOwnDuration(planId: number, id: number) {
    const duration = await this.durationRepository.findOne({ where: { id } });
    // The planId check is not redundant: without it, a request to
    // /plan/2/duration/5 could edit a duration belonging to plan 3.
    if (!duration || duration.planId !== planId || duration.deleted) {
      throw new NotFoundException(
        `La duración con ID: ${id} no existe en el plan ${planId}.`,
      );
    }
    return duration;
  }

  async update(
    planId: number,
    id: number,
    dto: PlanDurationDto,
  ): Promise<PlanDuration> {
    const duration = await this.requireOwnDuration(planId, id);

    if (dto.months !== duration.months) {
      const clash = await this.durationRepository.findOne({
        where: { planId, months: dto.months },
      });
      if (clash && !clash.deleted) {
        throw new ConflictException(
          `El plan ya tiene un precio para ${dto.months} meses.`,
        );
      }
    }

    duration.months = dto.months;
    duration.numDays = dto.numDays;
    duration.price = dto.price;
    return this.durationRepository.save(duration);
  }

  async remove(planId: number, id: number): Promise<{ message: string }> {
    const duration = await this.requireOwnDuration(planId, id);
    duration.deleted = true;
    await this.durationRepository.save(duration);
    return { message: 'Eliminada correctamente' };
  }
}
