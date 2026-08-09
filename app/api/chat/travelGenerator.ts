import { openai } from "@/lib/openai";
import {
  createTravelPlannerPrompt,
  travelPlanSchema,
} from "@/lib/prompts";

import type { CurrentLocation } from "./spotSelector";
import {
  getValidationErrors,
  isValidAITravelPlan,
  type AITravelPlan,
} from "./travelValidator";

type GenerateAITravelPlanParams = {
  spotList: string;
  message: string;
  days: number;
  specialRequest: string;
  currentLocation: CurrentLocation;
};

function normalizeDays(
  days: number
): number {
  if (
    !Number.isFinite(days) ||
    !Number.isInteger(days)
  ) {
    return 1;
  }

  return Math.max(days, 1);
}

function normalizeText(
  value: string
): string {
  return value.trim();
}

export async function generateAITravelPlan({
  spotList,
  message,
  days,
  specialRequest,
  currentLocation,
}: GenerateAITravelPlanParams): Promise<AITravelPlan | null> {
  const normalizedSpotList =
    normalizeText(spotList);

  const normalizedMessage =
    normalizeText(message);

  const normalizedSpecialRequest =
    normalizeText(specialRequest);

  const normalizedDays =
    normalizeDays(days);

  if (!normalizedSpotList) {
    console.error(
      "Travel generation skipped: spot list is empty."
    );

    return null;
  }

  if (!normalizedMessage) {
    console.error(
      "Travel generation skipped: message is empty."
    );

    return null;
  }

  try {
    
    const prompt =
  createTravelPlannerPrompt({
    spotList:
      normalizedSpotList,
    message:
      normalizedMessage,
    days:
      normalizedDays,
    specialRequest:
      normalizedSpecialRequest,
    currentLocation,
  });

if (
  process.env.NODE_ENV ===
  "development"
) {
  console.log(
    "===== Travel Prompt Size ====="
  );

  console.log(
    `${prompt.length} characters`
  );
}
    
    const response =
      await openai.responses.create({
        model: "gpt-5-mini",

        reasoning: {
          effort: "low",
        },

        text: {
          format: {
            type: "json_schema",
            name: "travel_plan",
            strict: true,
            schema: travelPlanSchema,
          },
        },

        input: prompt,
      });

    const outputText =
      response.output_text.trim();

    if (!outputText) {
      console.error(
        "Travel generation failed: OpenAI returned empty output."
      );

      return null;
    }

    let parsedResponse: unknown;

    try {
      parsedResponse =
        JSON.parse(
          outputText
        ) as unknown;
    } catch (error) {
      console.error(
        "Travel plan JSON parse error:",
        {
          outputText,
          error,
        }
      );

      return null;
    }

    if (
  !isValidAITravelPlan(
    parsedResponse
  )
) {
  console.error(
    "Invalid AI travel plan:",
    {
      errors:
        getValidationErrors(
          parsedResponse
        ),
      response:
        parsedResponse,
    }
  );

  return null;
}

    return parsedResponse;
  } catch (error) {
    console.error(
      "OpenAI travel generation error:",
      error
    );

    return null;
  }
}