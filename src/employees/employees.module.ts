import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EmployeesResolver } from './graphql/employees.resolver';
import { Employee, EmployeeSchema } from './persistence/employee.schema';
import { EmployeesRepository } from './persistence/employees.repository';
import { EmployeesService } from './employees.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
    ]),
  ],
  providers: [EmployeesRepository, EmployeesService, EmployeesResolver],
  exports: [EmployeesService],
})
export class EmployeesModule {}
