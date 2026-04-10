import type { DeliveryProviderResult, DeliveryShipmentPayload } from "@/modules/delivery/types";

export interface DeliveryProviderAdapter {
  readonly code: string;
  readonly label: string;
  createShipment(payload: DeliveryShipmentPayload): Promise<DeliveryProviderResult>;
  cancelShipment(trackingNumber: string): Promise<DeliveryProviderResult>;
  trackShipment(trackingNumber: string): Promise<DeliveryProviderResult>;
}
