import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';

@Schema({ collection: 'employees' })
export class Employee {
  /**
   * Human-readable business id (e.g. "emp-001"). In a real system employees
   * would come from an HR service; readable ids keep the API and the live
   * demo easy to follow.
   */
  @Prop({ type: String })
  _id: string;

  @Prop({ required: true })
  name: string;
}

export type EmployeeDocument = HydratedDocument<Employee>;

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
