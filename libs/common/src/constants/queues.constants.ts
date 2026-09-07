export const AUTH_SERVICE = 'AUTH_SERVICE';
export const AUTH_QUEUE = 'auth_queue';

export const PRODUCT_SERVICE = 'PRODUCT_SERVICE';
export const PRODUCT_QUEUE = 'product_queue';

export const ORDER_SERVICE = 'ORDER_SERVICE';
export const ORDER_QUEUE = 'order_queue';

export const DELIVERY_SERVICE = 'DELIVERY_SERVICE';
export const DELIVERY_QUEUE = 'delivery_queue';

export const PAYMENT_SERVICE = 'PAYMENT_SERVICE';
export const PAYMENT_QUEUE = 'payment_queue';

export const NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE';
export const NOTIFICATION_QUEUE = 'notification_queue';

// Message Patterns
export const MSG_PATTERNS = {
  AUTH: {
    REGISTER: 'auth.register',
    LOGIN: 'auth.login',
    VALIDATE: 'auth.validate',
    UPDATE_PROFILE: 'auth.update_profile',
    SEND_OTP: 'auth.send_otp',
    VERIFY_OTP: 'auth.verify_otp',
  },
  PRODUCT: {
    GET_ALL: 'product.get_all',
    GET_BY_ID: 'product.get_by_id',
    CREATE: 'product.create',
  },
  ORDER: {
    CREATE: 'order.create',
    GET_BY_USER: 'order.get_by_user',
    GET_BY_ID: 'order.get_by_id',
  },
  DELIVERY: {
    BOOK: 'delivery.book',
    GET_STATUS: 'delivery.get_status',
  },
  PAYMENT: {
    PROCESS: 'payment.process',
    GET_STATUS: 'payment.get_status',
  },
};
