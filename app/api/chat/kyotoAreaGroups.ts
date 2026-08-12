export type KyotoAreaGroup =
  | "東部"
  | "北西部"
  | "西部"
  | "南部"
  | "中心部"
  | "北部";

const KYOTO_AREA_GROUP_MAP: Record<
  string,
  KyotoAreaGroup
> = {
  "東山": "東部",
  "銀閣寺・岡崎": "東部",
  "一乗寺・修学院": "東部",

  "衣笠・北野": "北西部",
  "上賀茂・北山・大徳寺": "北西部",
  "高雄": "北西部",

  "嵯峨・嵐山": "西部",
  "桂・大原野": "西部",

  "伏見": "南部",
  "山科・醍醐": "南部",

  "京都駅周辺": "中心部",
  "市内中心部": "中心部",

  "大原・八瀬・比叡山": "北部",
  "鞍馬・貴船・花背": "北部",
  "洛北": "北部",
};

export function getKyotoAreaGroup(
  area: string
): KyotoAreaGroup | null {
  const normalizedArea =
    area.trim();

  if (!normalizedArea) {
    return null;
  }

  return (
    KYOTO_AREA_GROUP_MAP[
      normalizedArea
    ] ?? null
  );
}