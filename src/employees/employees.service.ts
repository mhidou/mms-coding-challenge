import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';

import { SEED_EMPLOYEES } from './employees.seed';
import { type EmployeeDocument } from './persistence/employee.schema';
import { EmployeesRepository } from './persistence/employees.repository';

@Injectable()
export class EmployeesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private readonly employeesRepository: EmployeesRepository) {}

  /** Seeds the employee collection so the API is usable out of the box. */
  async onApplicationBootstrap(): Promise<void> {
    await this.employeesRepository.upsertMany(SEED_EMPLOYEES);
    this.logger.log(`Seeded ${SEED_EMPLOYEES.length} employees`);
  }

  async list(): Promise<EmployeeDocument[]> {
    return this.employeesRepository.findAll();
  }

  async exists(employeeId: string): Promise<boolean> {
    return this.employeesRepository.exists(employeeId);
  }
}
