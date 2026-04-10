import { ecomLabsTools } from "@/modules/ecomlabs/tool-registry";

export type EcomLabsGenerateInput = {
  toolKey: string;
  productName: string;
  productContext: string;
  targetAudience?: string;
  angle?: string;
};

export async function generateEcomLabsOutput(input: EcomLabsGenerateInput) {
  const tool = ecomLabsTools.find((entry) => entry.key === input.toolKey);

  if (!tool) {
    throw new Error(`Unknown EcomLabs tool: ${input.toolKey}`);
  }

  const sharedContext = {
    product_name: input.productName,
    context: input.productContext,
    audience: input.targetAudience ?? "Algerian COD buyers",
    angle: input.angle ?? "Pain-aware conversion"
  };

  switch (input.toolKey) {
    case "hook-generator":
      return {
        ...sharedContext,
        hero: {
          badge: "وصلنا العرض لي يبيع",
          headline: `${input.productName} يحبس التردد ويطلق الطلبات`,
          subheadline: `مبني على ${sharedContext.angle.toLowerCase()} مع وضوح تام في المنفعة والطلب.`
        }
      };
    case "ad-copy-generator":
      return {
        ...sharedContext,
        copies: {
          pain_story: `راك تعاني من ${input.productContext}؟ ${input.productName} يسهلك القرار ويخلي الزبون يحس بالحل من أول سطر.`,
          fast_result: `${input.productName} يعطي عرض واضح، ثقة أكبر، وطلب أسرع.`,
          social_proof: `خدم مع عروض COD لي يحبها السوق الجزائري وخلا حملات كثيرة تربح أكثر.`
        }
      };
    case "offer-builder":
      return {
        ...sharedContext,
        offer_name: `${input.productName} Offer Stack`,
        promise: `عرض مركز على ${input.productContext} مع CTA واضح وثقة COD.`,
        bonuses: ["Delivery reassurance", "Urgency block", "Pain-to-solution framing"],
        cta: "اطلب الآن والدفع عند الاستلام"
      };
    case "landing-page-helper":
      return {
        ...sharedContext,
        sections: [
          "Hero",
          "Problem",
          "Solution",
          "Proof",
          "Urgency CTA"
        ],
        design_direction: "Warm conversion-focused layout with bold hierarchy and COD trust anchors."
      };
    case "creative-angle-generator":
      return {
        ...sharedContext,
        angles: [
          "Pain relief angle",
          "Fast transformation angle",
          "Trust and COD reassurance angle"
        ]
      };
    case "video-ad-scripts":
      return {
        ...sharedContext,
        scenes: {
          hook: "واش مزال الزبون يتردد؟",
          problem: `المشكل يبدأ كي ${input.productContext.toLowerCase()}.`,
          solution: `${input.productName} يبين الحل بشكل مباشر وواضح.`,
          social_proof: "النتائج والآراء تزيد الثقة.",
          cta: "اطلب دابا | الدفع عند الاستلام"
        }
      };
    case "product-finder":
      return {
        ...sharedContext,
        products: [
          {
            product_name: input.productName,
            why_it_sells: "Pain-led positioning and COD-friendly trust building.",
            decision: "Test with video hooks and delivery-aware offer positioning."
          }
        ]
      };
    default:
      return sharedContext;
  }
}
