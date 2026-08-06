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
import { subscriptionService } from './subscription.service';

@Controller('api/v1/subscription')
@ApiTags('subscriptiones')
export class subscriptionController {
  constructor(private readonly subscriptionService: subscriptionService) {}

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
