import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Employee, type EmployeeDocument } from './employee.schema';

@Injectable()
export class EmployeesRepository {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<Employee>,
  ) {}

  async findAll(): Promise<EmployeeDocument[]> {
    return this.employeeModel.find().sort({ _id: 1 }).exec();
  }

  async exists(employeeId: string): Promise<boolean> {
    const count = await this.employeeModel
      .countDocuments({ _id: employeeId })
      .exec();
    return count > 0;
  }

  /** Idempotent bulk upsert used by the startup seed. */
  async upsertMany(employees: Employee[]): Promise<void> {
    await this.employeeModel.bulkWrite(
      employees.map((employee) => ({
        updateOne: {
          filter: { _id: employee._id },
          update: { $set: { name: employee.name } },
          upsert: true,
        },
      })),
    );
  }
}
