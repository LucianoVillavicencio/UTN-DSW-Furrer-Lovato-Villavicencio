import {
  Controller,
  Body,
  Post,
  Get,
  Param,
  Put,
  Delete,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SubscriptionDto } from './dto/subscription-dto';
import { ChangePlanDto } from './dto/change-plan-dto';
import { subscriptionService } from './subscription.service';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import type { UserActiveInterface } from '../../common/interfaces/user-active.interface';
import { Role } from '../../common/enum/rol.enum';

// Admin-only salvo /change-plan y /me (self-service, ver abajo): antes este
// controller no tenía ningún guard — cualquiera podía listar las
// suscripciones (con nombre/email/teléfono de cada usuario) o editarlas.
@Controller('api/v1/subscription')
@ApiTags('subscriptiones')
@Auth(Role.ADMIN)
export class subscriptionController {
  constructor(private readonly subscriptionService: subscriptionService) {}

  // Self-service: crea/renueva la suscripción del usuario autenticado sobre
  // otro plan. userDni sale del JWT, nunca del body — ver ChangePlanDto.
  @Post('change-plan')
  @Auth()
  changePlan(
    @ActiveUser() user: UserActiveInterface,
    @Body() dto: ChangePlanDto,
  ) {
    return this.subscriptionService.changePlan(user.sub, dto.planId);
  }

  // Self-service: suscripción activa del usuario autenticado (para el tab
  // "Mi plan" del dashboard). Antes de esto no había forma de pedir "la mía"
  // sin traer la lista completa de todos los usuarios.
  @Get('me')
  @Auth()
  getMySubscription(@ActiveUser() user: UserActiveInterface) {
    return this.subscriptionService.findActiveForUser(user.sub);
  }

  @Post()
  createSubscription(@Body() subscriptionDto: SubscriptionDto) {
    return this.subscriptionService.createSubscription(subscriptionDto);
  }

  @Get()
  getSubscriptiones() {
    return this.subscriptionService.findAll();
  }

  @Get('filter/deleted')
  getSubscriptionesDeleted() {
    return this.subscriptionService.findAllDeleted();
  }

  // Historial de suscripciones de un usuario puntual (panel de Usuarios).
  // Va antes de '/:id' — mismo motivo que /search en UserController.
  @Get('by-user/:dni')
  getSubscriptionsByUser(@Param('dni', ParseIntPipe) dni: number) {
    return this.subscriptionService.findByUser(dni);
  }

  @Get('/:id')
  getSubscriptionById(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionService.findSubscription(id);
  }

  @Put()
  updateSubscription(@Body() subscriptionDto: SubscriptionDto) {
    return this.subscriptionService.updateSubscription(subscriptionDto);
  }

  @Delete('/:id')
  deleteSubscription(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionService.deleteSubscription(id);
  }

  @Patch('/restore/:id')
  restoreSubscription(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionService.restoreSubscription(id);
  }
}
