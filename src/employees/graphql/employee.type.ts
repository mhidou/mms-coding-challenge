import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Employee')
export class EmployeeType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}
