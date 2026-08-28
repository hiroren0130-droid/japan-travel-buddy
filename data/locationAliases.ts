export type LocationAliasEntry = {
  spotId: string;
  aliases: readonly string[];
};

export const locationAliases = [
  {
    spotId: "osaka-station-city",
    aliases: [
      "大阪駅",
      "Osaka Station",
      "JR大阪駅",
      "JR Osaka Station",
    ],
  },
] as const satisfies readonly LocationAliasEntry[];
