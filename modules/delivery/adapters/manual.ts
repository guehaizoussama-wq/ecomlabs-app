import type { DeliveryProviderAdapter } from "@/modules/delivery/adapters/base";
import type { DeliveryProviderResult, DeliveryShipmentPayload } from "@/modules/delivery/types";

export class ManualDeliveryAdapter implements DeliveryProviderAdapter {
  readonly code = "MANUAL";
  readonly label = "Manual Delivery";

  async createShipment(payload: DeliveryShipmentPayload): Promise<DeliveryProviderResult> {
    return {
      success: true,
      trackingNumber: `MAN-${payload.reference}`,
      rawResponse: { mode: "manual", payload },
      normalizedStatus: "pending_pickup"
    };
  }

  async cancelShipment(trackingNumber: string): Promise<DeliveryProviderResult> {
    return {
      success: true,
      trackingNumber,
      rawResponse: { mode: "manual", trackingNumber, action: "cancel" },
      normalizedStatus: "cancelled"
    };
  }

  async trackShipment(trackingNumber: string): Promise<DeliveryProviderResult> {
    return {
      success: true,
      trackingNumber,
      rawResponse: { mode: "manual", trackingNumber, action: "track" },
      normalizedStatus: "in_transit"
    };
  }
}
