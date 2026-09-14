import jsPDF from "jspdf";

import type { Locale } from "@/lib/locale";
import { getLocalizedSpotName } from "@/lib/localizedSpot";
import { getMessages } from "@/lib/messages";
import { getSpotById } from "@/lib/spotService";
import {
  createTravelPlanPdfFilename,
  getTravelPlanExportMessages,
} from "@/lib/travelPlanExport";
import type { TravelPlan } from "@/types/travel";

const PDF_PAGE_WIDTH = 1240;
const PDF_PAGE_HEIGHT = 1754;
const PDF_MARGIN = 100;

/** These fields belong to the plan and apply to each day's itinerary. */
function getDayBoundaryLines(plan: TravelPlan, locale: Locale): string[] {
  const fields = ["startLocation", "startTime", "endLocation", "endTime"] as const;
  const labels = locale === "ja"
    ? ["出発", "出発時刻", "到着", "到着時刻"]
    : ["Start", "Start time", "End", "End time"];
  return fields.flatMap((field, index) => {
    const value = plan[field];
    // Saved/runtime data may contain null despite the optional string type.
    return typeof value === "string" && value.trim()
      ? [`${labels[index]}: ${value.trim()}`] : [];
  });
}

function downloadJapaneseTravelPlanPdf(
  plan: TravelPlan,
  pdf: jsPDF,
  filename: string,
  dayLabel: (day: number) => string,
  unknownSpot: string,
  transportLabels: Record<string, string>
) {
  const canvas = document.createElement("canvas");
  canvas.width = PDF_PAGE_WIDTH;
  canvas.height = PDF_PAGE_HEIGHT;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("PDF canvas is unavailable.");
  }

  let y = PDF_MARGIN;
  let pageNumber = 0;

  const resetPage = () => {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT);
    context.fillStyle = "#111827";
    context.textBaseline = "top";
    y = PDF_MARGIN;
  };

  const savePage = () => {
    if (pageNumber > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      0,
      0,
      210,
      297
    );
    pageNumber += 1;
    resetPage();
  };

  const ensureSpace = (height: number) => {
    if (y + height <= PDF_PAGE_HEIGHT - PDF_MARGIN) {
      return;
    }

    savePage();
  };

  const wrapText = (text: string, maxWidth: number): string[] => {
    const lines: string[] = [];
    let currentLine = "";

    for (const character of text) {
      if (character === "\n") {
        lines.push(currentLine);
        currentLine = "";
        continue;
      }

      const candidate = `${currentLine}${character}`;

      if (
        currentLine &&
        context.measureText(candidate).width > maxWidth
      ) {
        lines.push(currentLine);
        currentLine = character;
      } else {
        currentLine = candidate;
      }
    }

    if (currentLine || lines.length === 0) {
      lines.push(currentLine);
    }

    return lines;
  };

  const writeText = (
    text: string,
    {
      fontSize,
      lineHeight,
      indent = 0,
      weight = 400,
    }: {
      fontSize: number;
      lineHeight: number;
      indent?: number;
      weight?: number;
    }
  ) => {
    context.font = `${weight} ${fontSize}px "Yu Gothic", "Meiryo", sans-serif`;

    for (const line of wrapText(
      text,
      PDF_PAGE_WIDTH - PDF_MARGIN * 2 - indent
    )) {
      ensureSpace(lineHeight);
      context.fillText(line, PDF_MARGIN + indent, y);
      y += lineHeight;
    }
  };

  resetPage();
  writeText(plan.title, {
    fontSize: 42,
    lineHeight: 58,
    weight: 700,
  });
  y += 20;

  if (plan.summary) {
    writeText(plan.summary, {
      fontSize: 25,
      lineHeight: 40,
    });
    y += 32;
  }

  plan.days.forEach((day) => {
    ensureSpace(70);
    writeText(dayLabel(day.day), {
      fontSize: 32,
      lineHeight: 48,
      weight: 700,
    });
    y += 12;

    const boundaryLines = getDayBoundaryLines(plan, "ja");
    for (const line of boundaryLines) {
      writeText(line, { fontSize: 22, lineHeight: 34, indent: 25 });
    }
    if (boundaryLines.length) y += 10;

    day.items.forEach((item) => {
      const spot = getSpotById(item.spotId);
      const spotName = spot
        ? getLocalizedSpotName(spot, "ja")
        : unknownSpot;
      const transportDetails = [
        item.transport
          ? (transportLabels[item.transport] ?? item.transport)
          : undefined,
        item.duration,
      ]
        .filter(Boolean)
        .join(" ・ ");

      writeText(
        [item.time, spotName, item.description, transportDetails]
          .filter(Boolean)
          .join("  "),
        {
          fontSize: 22,
          lineHeight: 34,
          indent: 25,
        }
      );
      y += 10;
    });

    y += 28;
  });

  savePage();
  pdf.save(filename);
}

export function downloadTravelPlanPdf(
  plan: TravelPlan,
  locale: Locale
) {
  const pdf = new jsPDF();
  const messages = getTravelPlanExportMessages(locale);
  const transportMessages = getMessages(locale).timelineItem.transport;
  const transportLabels: Record<string, string> = {
    徒歩: transportMessages.walking,
    JR: transportMessages.jr,
    電車: transportMessages.train,
    地下鉄: transportMessages.subway,
    バス: transportMessages.bus,
    タクシー: transportMessages.taxi,
  };
  const filename = createTravelPlanPdfFilename(plan.title, locale);

  if (locale === "ja") {
    downloadJapaneseTravelPlanPdf(
      plan,
      pdf,
      filename,
      messages.dayLabel,
      messages.unknownSpot,
      transportLabels
    );
    return;
  }

  let y = 20;

  const ensureSpace = (height: number) => {
    if (y + height <= 280) {
      return;
    }

    pdf.addPage();
    y = 20;
  };

  const writeWrappedText = (
    text: string,
    x: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const lines = pdf.splitTextToSize(text, maxWidth) as string[];

    lines.forEach((line) => {
      ensureSpace(lineHeight);
      pdf.text(line, x, y);
      y += lineHeight;
    });
  };

  pdf.setFontSize(20);
  writeWrappedText(plan.title, 20, 170, 10);
  y += 2;

  if (plan.summary) {
    pdf.setFontSize(12);
    writeWrappedText(plan.summary, 20, 170, 7);
    y += 5;
  }

  plan.days.forEach((day) => {
    ensureSpace(12);
    pdf.setFontSize(16);
    pdf.text(messages.dayLabel(day.day), 20, y);

    y += 10;

    const boundaryLines = getDayBoundaryLines(plan, locale);
    pdf.setFontSize(11);
    for (const line of boundaryLines) {
      writeWrappedText(line, 25, 165, 7);
    }
    if (boundaryLines.length) y += 3;

    day.items.forEach((item) => {
      const spot = getSpotById(item.spotId);
      const spotName = spot
        ? getLocalizedSpotName(spot, locale)
        : messages.unknownSpot;
      const transportDetails = [
        item.transport
          ? (transportLabels[item.transport] ?? item.transport)
          : undefined,
        item.duration?.replace(/^(\d+)分$/, "$1 min"),
      ]
        .filter(Boolean)
        .join(" · ");

      pdf.setFontSize(11);
      writeWrappedText(
        [item.time, spotName, item.description, transportDetails]
          .filter(Boolean)
          .join("  "),
        25,
        165,
        7
      );
      y += 1;
    });

    y += 8;
  });

  pdf.save(filename);
}
