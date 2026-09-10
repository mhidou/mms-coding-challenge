import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { OrderState } from '../domain/order-state';

@InputType()
export class CustomerInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsEmail()
  email: string;
}

@InputType()
export class LineItemInput {
  @Field()
  @IsNotEmpty()
  productName: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;

  @Field(() => Int, { description: 'Unit price in euro cents.' })
  @IsInt()
  @Min(0)
  unitPriceCents: number;
}

@InputType()
export class CreateOrderInput {
  @Field(() => CustomerInput)
  @ValidateNested()
  @Type(() => CustomerInput)
  customer: CustomerInput;

  @Field(() => [LineItemInput])
  @ArrayMinSize(1, { message: 'an order must contain at least one line item' })
  @ValidateNested({ each: true })
  @Type(() => LineItemInput)
  lineItems: LineItemInput[];
}

@ArgsType()
export class ListOrdersArgs {
  @Field(() => OrderState, { nullable: true })
  @IsOptional()
  @IsEnum(OrderState)
  state?: OrderState;

  @Field(() => Int, { defaultValue: 0 })
  @Min(0)
  skip: number = 0;

  @Field(() => Int, { defaultValue: 20, description: 'Page size (max 100).' })
  @Min(1)
  @Max(100)
  limit: number = 20;
}
