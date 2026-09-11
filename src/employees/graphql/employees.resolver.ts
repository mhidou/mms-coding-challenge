import { Query, Resolver } from '@nestjs/graphql';

import { EmployeesService } from '../employees.service';
import { EmployeeType } from './employee.type';

@Resolver(() => EmployeeType)
export class EmployeesResolver {
  constructor(private readonly employeesService: EmployeesService) {}

  @Query(() => [EmployeeType], {
    description: 'Store employees available for order assignment.',
  })
  async employees(): Promise<EmployeeType[]> {
    const employees = await this.employeesService.list();
    return employees.map((employee) => ({
      id: employee._id,
      name: employee.name,
    }));
  }
}
