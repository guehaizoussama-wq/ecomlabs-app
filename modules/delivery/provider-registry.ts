import { ManualDeliveryAdapter } from "@/modules/delivery/adapters/manual";
import { YalidineAdapter } from "@/modules/delivery/adapters/yalidine";

export function getDeliveryAdapter(providerCode: string) {
  switch (providerCode) {
    case "YALIDINE":
      return new YalidineAdapter({
        apiId: process.env.YALIDINE_API_ID ?? "",
        apiToken: process.env.YALIDINE_API_TOKEN ?? "",
        fromWilayaName: process.env.YALIDINE_FROM_WILAYA ?? "Alger"
      });
    default:
      return new ManualDeliveryAdapter();
  }
}
