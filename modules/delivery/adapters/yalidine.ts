import type { DeliveryProviderAdapter } from "@/modules/delivery/adapters/base";
import type { DeliveryProviderResult, DeliveryShipmentPayload } from "@/modules/delivery/types";

type YalidineCredentials = {
  apiId: string;
  apiToken: string;
  fromWilayaName: string;
};

export class YalidineAdapter implements DeliveryProviderAdapter {
  readonly code = "YALIDINE";
  readonly label = "Yalidine";

  constructor(private readonly credentials: YalidineCredentials) {}

  private get headers() {
    return {
      "Content-Type": "application/json",
      "X-API-ID": this.credentials.apiId,
      "X-API-TOKEN": this.credentials.apiToken
    };
  }

  async createShipment(payload: DeliveryShipmentPayload): Promise<DeliveryProviderResult> {
    const requestBody = [
      {
        order_id: payload.reference,
        from_wilaya_name: this.credentials.fromWilayaName,
        firstname: payload.customerName,
        familyname: "",
        contact_phone: payload.phone,
        address: payload.address,
        to_commune_name: payload.commune,
        to_wilaya_name: payload.wilaya,
        product_list: `${payload.productList}, الكمية: ${payload.quantity}`,
        price: payload.customerFee,
        do_insurance: false,
        declared_value: payload.codAmount,
        height: 10,
        width: 20,
        length: 30,
        weight: 1,
        freeshipping: true,
        is_stopdesk: payload.stopDesk,
        has_exchange: false,
        product_to_collect: null
      }
    ];

    const response = await fetch("https://api.yalidine.app/v1/parcels/", {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(requestBody),
      cache: "no-store"
    });

    const data = (await response.json().catch(() => null)) as { tracking?: string }[] | null;
    const trackingNumber = data?.[0]?.tracking ?? null;

    return {
      success: response.ok,
      trackingNumber,
      rawResponse: Array.isArray(data) ? { parcels: data } : null,
      normalizedStatus: trackingNumber ? "submitted" : "submission_failed"
    };
  }

  async cancelShipment(trackingNumber: string): Promise<DeliveryProviderResult> {
    return {
      success: true,
      trackingNumber,
      rawResponse: {
        note: "Yalidine cancellation can be implemented when API credentials and endpoint contract are finalized."
      },
      normalizedStatus: "cancel_requested"
    };
  }

  async trackShipment(trackingNumber: string): Promise<DeliveryProviderResult> {
    const response = await fetch(`https://api.yalidine.app/v1/histories/${trackingNumber}`, {
      method: "GET",
      headers: this.headers,
      cache: "no-store"
    });

    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    return {
      success: response.ok,
      trackingNumber,
      rawResponse: data,
      normalizedStatus: response.ok ? "in_transit" : "tracking_failed"
    };
  }
}
