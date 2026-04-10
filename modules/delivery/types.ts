export type DeliveryShipmentPayload = {
  reference: string;
  customerName: string;
  phone: string;
  address: string;
  wilaya: string;
  commune: string;
  productList: string;
  quantity: number;
  codAmount: number;
  customerFee: number;
  stopDesk: boolean;
};

export type DeliveryProviderResult = {
  success: boolean;
  trackingNumber: string | null;
  rawResponse: Record<string, unknown> | null;
  normalizedStatus: string;
};
