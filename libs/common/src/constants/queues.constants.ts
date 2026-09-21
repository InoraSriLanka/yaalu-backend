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

export const MSG_PATTERNS = {
  DELIVERY: {
    BOOK: 'delivery.book',
    GET_STATUS: 'delivery.getStatus',
    CREATE_RIDE: 'delivery.createRide',
    GET_RIDE: 'delivery.getRide',
    POST_BID: 'delivery.postBid',
    GET_BIDS: 'delivery.getBids',
    ACCEPT_BID: 'delivery.acceptBid',
    VERIFY_PIN: 'delivery.verifyPin',
    COMPLETE_RIDE: 'delivery.completeRide',
    SUBMIT_FEEDBACK: 'delivery.submitFeedback',
  },
};
