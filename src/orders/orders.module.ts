import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';

import { EmployeesModule } from '../employees/employees.module';

import {
  BadUserInputFilter,
  DomainErrorFilter,
} from './graphql/graphql-error.filters';
import { OrdersResolver } from './graphql/orders.resolver';

import { Order, OrderSchema } from './persistence/order.schema';
import { OrdersRepository } from './persistence/orders.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    EmployeesModule,
  ],
  providers: [
    OrdersRepository,
    OrdersService,
    OrdersResolver,
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    { provide: APP_FILTER, useClass: BadUserInputFilter },
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
