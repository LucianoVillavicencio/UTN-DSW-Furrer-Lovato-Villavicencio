import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { SubscriptionDto } from './dto/subscription-dto';
import { Subscription } from './entity/subscription.entity';
import { SubscriptionState } from './enum/subscription-state.enum';
import { PlanService } from '../plan/plan.service';
import { UserService } from '../user/user.service';

// Formats using the LOCAL date parts, not UTC, so that "today" in the server's
// timezone does not shift to the previous or next day on its way into a MySQL
// 'date' column.
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
    private readonly userService: UserService,
  ) {}

  // Moves the authenticated user to another plan: closes the active
  // subscription, if there is one, and opens a new one on the chosen plan. This
  // is not a payment — the charge is settled separately (in person for now,
  // through Mercado Pago later); see specs.md §2.3. Because of that, a
  // self-service change opens the new subscription PENDING and an admin
  // recording the payment is what activates it: otherwise anyone could register
  // and grant themselves an active plan for free.
  async changePlan(userDni: number, planId: number, byAdmin = false) {
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
        throw new ConflictException(
          byAdmin
            ? 'El socio ya está suscripto a este plan.'
            : 'Ya estás suscripto a este plan.',
        );
      }
      // The front-desk path is supervised and swaps the plan on the spot; the
      // self-service path keeps the member's current access until the new
      // plan's payment is recorded — see `activate`, which cancels the old
      // ACTIVE subscription once the new one is paid, not before.
      if (byAdmin) {
        currentActive.state = SubscriptionState.CANCELLED;
        await this.subscriptionRepository.save(currentActive);
      }
    }

    // Dates as 'YYYY-MM-DD' strings rather than a Date carrying a time, so the
    // MySQL 'date' column cannot shift them by a day through timezone
    // conversion — the same approach the frontend already uses in Plan.tsx with
    // toISOString().split('T')[0].
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
      // A self-service change opens PENDING: it only becomes ACTIVE once an
      // admin records the payment (see PaymentService.createManualPayment).
      // The front-desk path goes through assignPlanToMember, which is
      // staff-supervised, so it keeps activating on the spot.
      state: byAdmin ? SubscriptionState.ACTIVE : SubscriptionState.PENDING,
      deleted: false,
    });

    return this.findSubscription(
      (await this.subscriptionRepository.save(newSubscription)).id,
    );
  }

  // Same move as changePlan, made by an admin on behalf of a member who is
  // standing at the counter. The DNI comes from the route instead of the JWT,
  // so unlike the self-service path it has to be checked.
  async assignPlanToMember(userDni: number, planId: number) {
    const member = await this.userService.findUser(userDni);
    if (!member || member.deleted) {
      throw new NotFoundException(`El socio con DNI: ${userDni} no existe.`);
    }
    return this.changePlan(userDni, planId, true);
  }

  // Full subscription history of one specific user (admin Users panel), most
  // recent first.
  async findByUser(userDni: number) {
    return this.subscriptionRepository.find({
      where: { userDni, deleted: false },
      relations: { plan: true },
      order: { id: 'DESC' },
    });
  }

  // Promotes a PENDING subscription once its payment is recorded. Called by
  // PaymentService so that payment never has to reach into this repository.
  // This is also where the member's previous plan actually loses access: a
  // self-service changePlan leaves the old ACTIVE subscription untouched, so
  // it has to be cancelled here, once the replacement is paid for.
  async activate(id: number) {
    const subscription = await this.findSubscription(id);
    if (!subscription) {
      throw new NotFoundException(`La suscripción con ID: ${id} no existe.`);
    }

    const previousActive = await this.subscriptionRepository.findOne({
      where: {
        userDni: subscription.userDni,
        state: SubscriptionState.ACTIVE,
        deleted: false,
      },
    });
    if (previousActive && previousActive.id !== subscription.id) {
      previousActive.state = SubscriptionState.CANCELLED;
      await this.subscriptionRepository.save(previousActive);
    }

    subscription.state = SubscriptionState.ACTIVE;
    return this.subscriptionRepository.save(subscription);
  }

  // The authenticated user's active subscription, or null if there is none.
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
