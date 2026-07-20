import jsPDF from "jspdf";

import { TravelPlan } from "@/types/travel";
import { getSpotById } from "@/lib/spotService";

export function downloadTravelPlanPdf(plan: TravelPlan) {
  const pdf = new jsPDF();

  let y = 20;

  pdf.setFontSize(20);
  pdf.text(plan.title, 20, y);

  y += 12;

  if (plan.summary) {
    pdf.setFontSize(12);
    pdf.text(plan.summary, 20, y);
    y += 12;
  }

  plan.days.forEach((day) => {
    pdf.setFontSize(16);
    pdf.text(`Day ${day.day}`, 20, y);

    y += 10;

    day.items.forEach((item) => {
      const spot = getSpotById(item.spotId);

      pdf.setFontSize(11);

      pdf.text(
        `${item.time}  ${spot?.name ?? "Unknown Spot"}  ${item.description}`,
        25,
        y
      );

      y += 8;

      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
    });

    y += 8;
  });

  pdf.save(`${plan.title}.pdf`);
}