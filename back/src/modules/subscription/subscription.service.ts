import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { SubscriptionDto } from './dto/subscription-dto';
import { Subscription } from './entity/subscription.entity';
import { SubscriptionState } from './enum/subscription-state-enum';
import { PlanService } from '../plan/plan.service';

// Formatea usando los componentes de fecha LOCALES (no UTC), para que
// "hoy" en el timezone del servidor no se convierta al día anterior/
// siguiente al pasar por una columna 'date' de MySQL.
function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class subscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private readonly planService: PlanService,
  ) {}

  // Cambia de plan al usuario autenticado: cierra la suscripción activa (si
  // hay una) y abre una nueva sobre el plan elegido. No es un pago — el
  // estado del cobro se resuelve aparte (pago presencial o, más adelante,
  // Mercado Pago); ver specs.md §2.3.
  async changePlan(userDni: number, planId: number) {
    const plan = await this.planService.findPlan(planId);
    if (!plan || plan.deleted) {
      throw new NotFoundException(`El plan con ID: ${planId} no existe.`);
    }

    const currentActive = await this.subscriptionRepository.findOne({
      where: {
        userDni,
        state: SubscriptionState.ACTIVE,
        deleted: false,
      },
    });

    if (currentActive) {
      if (currentActive.planId === planId) {
        throw new ConflictException('Ya estás suscripto a este plan.');
      }
      currentActive.state = SubscriptionState.CANCELLED;
      await this.subscriptionRepository.save(currentActive);
    }

    // Fechas como string 'YYYY-MM-DD' (no Date con hora) para que la
    // columna 'date' de MySQL no las corra un día por conversión de
    // timezone al serializar — mismo criterio que ya usa el front en
    // Plan.tsx con toISOString().split('T')[0].
    const today = new Date();
    const start = toDateOnly(today);
    const endJs = new Date(today);
    endJs.setDate(endJs.getDate() + plan.numDays);
    const end = toDateOnly(endJs);

    const newSubscription = this.subscriptionRepository.create({
      userDni,
      planId,
      startDate: start as unknown as Date,
      endDate: end as unknown as Date,
      state: SubscriptionState.ACTIVE,
      deleted: false,
    });

    return this.findSubscription(
      (await this.subscriptionRepository.save(newSubscription)).id,
    );
  }

  // Historial completo de suscripciones de un usuario puntual (panel admin
  // de Usuarios), más recientes primero.
  async findByUser(userDni: number) {
    return this.subscriptionRepository.find({
      where: { userDni, deleted: false },
      relations: { plan: true },
      order: { id: 'DESC' },
    });
  }

  // Suscripción activa del usuario autenticado (o null si no tiene).
  async findActiveForUser(userDni: number) {
    return this.subscriptionRepository.findOne({
      where: { userDni, state: SubscriptionState.ACTIVE, deleted: false },
      relations: { plan: true },
    });
  }

  async createSubscription(subscriptionDto: SubscriptionDto) {
    const newSubscription = this.subscriptionRepository.create({
      ...subscriptionDto,
      startDate: new Date(subscriptionDto.startDate),
      endDate: new Date(subscriptionDto.endDate),
      state: subscriptionDto.state ?? SubscriptionState.ACTIVE,
      deleted: subscriptionDto.deleted ?? false,
    });
    return await this.subscriptionRepository.save(newSubscription);
  }

  async findSubscription(id: number) {
    return await this.subscriptionRepository.findOne({
      where: { id },
      relations: { user: true, plan: true },
    });
  }

  async findAll() {
    return await this.subscriptionRepository.find({
      where: { deleted: false },
      relations: { user: true, plan: true },
    });
  }

  async findAllDeleted() {
    return await this.subscriptionRepository.find({
      where: { deleted: true },
      relations: { user: true, plan: true },
    });
  }

  async updateSubscription(subscriptionDto: SubscriptionDto) {
    if (!subscriptionDto.id) {
      throw new ConflictException(
        'El ID de la suscripción es obligatorio para actualizar.',
      );
    }
    const exists = await this.findSubscription(subscriptionDto.id);
    if (!exists) {
      throw new NotFoundException(
        `La suscripción con ID: ${subscriptionDto.id} no existe.`,
      );
    }
    const updatedsubscription = {
      ...subscriptionDto,
      startDate: subscriptionDto.startDate
        ? new Date(subscriptionDto.startDate)
        : exists.startDate,
      endDate: subscriptionDto.endDate
        ? new Date(subscriptionDto.endDate)
        : exists.endDate,
    };
    return await this.subscriptionRepository.save(updatedsubscription);
  }

  async deleteSubscription(id: number) {
    const exists = await this.findSubscription(id);
    if (!exists) {
      throw new NotFoundException(`La suscripción con ID: ${id} no existe.`);
    }
    if (exists.deleted) {
      throw new ConflictException(`La suscripción ya está eliminada.`);
    }
    const rows: UpdateResult = await this.subscriptionRepository.update(
      { id },
      { deleted: true },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo eliminar la suscripcion`);
    }

    return { message: `Eliminada correctamente` };
  }
  async restoreSubscription(id: number) {
    const exists = await this.findSubscription(id);
    if (!exists) {
      throw new NotFoundException(`La suscripción con ID: ${id} no existe.`);
    }
    if (!exists.deleted) {
      throw new ConflictException(`La suscripción no está borrada.`);
    }
    const rows: UpdateResult = await this.subscriptionRepository.update(
      { id },
      { deleted: false },
    );
    if (rows.affected === 0) {
      throw new ConflictException(`No se pudo restaurar la suscripcion`);
    }

    return { message: `Restaurada correctamente` };
  }
}
