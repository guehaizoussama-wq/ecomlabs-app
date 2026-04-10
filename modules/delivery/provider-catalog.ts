export type DeliveryProviderDefinition = {
  code: string;
  name: string;
  authPattern: string;
  endpoints: string[];
  capabilityNotes: string[];
};

export const deliveryProviderCatalog: DeliveryProviderDefinition[] = [
  {
    code: "DHD",
    name: "DHD",
    authPattern: "Authorization: Bearer <token>",
    endpoints: ["/create/order", "/delete/order", "/get/orders/status", "/get/communes"],
    capabilityNotes: ["Ecotrack-like payloads", "Delete previous shipment before re-create"]
  },
  {
    code: "ANDERSON",
    name: "Anderson",
    authPattern: "Authorization: Bearer <token>",
    endpoints: ["/create/order", "/delete/order", "/get/orders/status", "/get/communes"],
    capabilityNotes: ["Ecotrack-like partner", "Stop-desk commune validation"]
  },
  {
    code: "NOEST",
    name: "Noest",
    authPattern: "Provider token header",
    endpoints: ["/create/order", "/delete/order"],
    capabilityNotes: ["Station code mapping", "Custom wilaya/commune tolerance matching"]
  },
  {
    code: "YALIDINE",
    name: "Yalidine",
    authPattern: "X-API-ID + X-API-TOKEN",
    endpoints: ["/v1/parcels", "/v1/communes", "/v1/histories/{tracking}"],
    capabilityNotes: [
      "Supports stop-desk fallback detection",
      "Uses commune lookup and stopdesk_id mapping",
      "Tracking history fetched immediately after parcel creation"
    ]
  },
  {
    code: "MANUAL",
    name: "Manual Delivery",
    authPattern: "No API credentials required",
    endpoints: [],
    capabilityNotes: ["Fallback adapter for internal couriers or unsupported partners"]
  }
];
