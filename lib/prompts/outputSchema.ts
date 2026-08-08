export const travelPlanSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    title: {
      type: "string",
      minLength: 1,
      maxLength: 80,
    },

    summary: {
      type: "string",
      minLength: 1,
      maxLength: 300,
    },

    days: {
      type: "array",
      minItems: 1,
      maxItems: 14,

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          day: {
            type: "integer",
            minimum: 1,
            maximum: 14,
          },

          items: {
            type: "array",
            minItems: 1,
            maxItems: 8,

            items: {
              type: "object",
              additionalProperties: false,

              properties: {
                time: {
                  type: "string",
                  pattern: "^([01][0-9]|2[0-3]):[0-5][0-9]$",
                },

                spot: {
                  type: "string",
                  minLength: 1,
                  maxLength: 100,
                },

                description: {
                  type: "string",
                  minLength: 1,
                  maxLength: 200,
                },

                transport: {
                  type: "string",
                  enum: [
                    "徒歩",
                    "バス",
                    "電車",
                    "地下鉄",
                    "JR",
                    "タクシー",
                  ],
                },

                duration: {
                  type: "string",
                  pattern: "^(0|[1-9][0-9]{0,2})分$",
                },
              },

              required: [
                "time",
                "spot",
                "description",
                "transport",
                "duration",
              ],
            },
          },
        },

        required: ["day", "items"],
      },
    },
  },

  required: ["title", "summary", "days"],
} as const;