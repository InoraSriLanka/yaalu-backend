export class Delivery {
  id: string;
  orderId: string;
  riderId?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
