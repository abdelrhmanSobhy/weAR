export interface PaymentMethod {
  id: string;
  providerType: string;
  cardholderName: string;
  cardNumberLast4: string;
  expiryDate: string;
  isDefault: boolean;
  isSaved: boolean;
  isExpired: boolean;
  createdAt: string;
}

export interface AddPaymentMethodRequest {
  providerType: string;
  cardholderName: string;
  cardNumberLast4: string;
  expiryDate: string;
  stripePaymentMethodId: string;
  isSaved: boolean;
  setAsDefault: boolean;
}
