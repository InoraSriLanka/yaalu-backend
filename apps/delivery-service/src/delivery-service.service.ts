import { Injectable } from '@nestjs/common';

@Injectable()
export class DeliveryServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
