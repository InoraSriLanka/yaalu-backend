import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @MessagePattern('customer.create')
  create(@Payload() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @MessagePattern('customer.findAll')
  findAll(@Payload() data: { merchantId: string }) {
    return this.customersService.findAll(data.merchantId);
  }

  @MessagePattern('customer.findOne')
  findOne(@Payload() data: { id: string }) {
    return this.customersService.findOne(data.id);
  }

  @MessagePattern('customer.update')
  update(@Payload() data: { id: string; dto: UpdateCustomerDto }) {
    return this.customersService.update(data.id, data.dto);
  }

  @MessagePattern('customer.delete')
  remove(@Payload() data: { id: string }) {
    return this.customersService.remove(data.id);
  }
}
