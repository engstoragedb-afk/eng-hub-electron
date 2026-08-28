import toast from "react-hot-toast";

let cachedLogoImg: HTMLImageElement | null = null;

function getLogoImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (cachedLogoImg && cachedLogoImg.complete) {
      resolve(cachedLogoImg);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/images/icon.png";
    img.onload = () => {
      cachedLogoImg = img;
      resolve(img);
    };
    img.onerror = () => {
      resolve(img); // Proceed even if logo fails
    };
  });
}

export async function copyUnitReportImage(
  unit: any,
  aplData: any[],
  selectedAplIds: string[]
): Promise<boolean> {
  try {
    const selectedItems = aplData.filter((item: any) =>
      selectedAplIds.includes(item.category_apl_id || item.id)
    );

    if (selectedItems.length === 0) {
      toast.error("Pilih minimal 1 komponen untuk disalin.");
      return false;
    }

    const logoImg = await getLogoImage();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Gagal membuat canvas gambar.");
      return false;
    }

    const width = 850;
    const itemRowHeight = 44;
    const headerHeight = 222;
    const footerHeight = 20;
    const contentHeight = Math.max(100, selectedItems.length * itemRowHeight);
    const height = headerHeight + contentHeight + footerHeight;

    const scale = 2; // High-DPI 2x Retina
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // 1. Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // 2. Decorative Top Blue Bar
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#0284c7");
    gradient.addColorStop(0.5, "#0ea5e9");
    gradient.addColorStop(1, "#38bdf8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 6);

    // 3. Header: Logo & Title
    const logoY = 20;
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      try {
        ctx.drawImage(logoImg, 32, logoY, 68, 68);
      } catch (e) {
        console.error("Logo drawing error:", e);
      }
    }

    const titleX = 116;
    const unitCode = unit?.code || unit?.name || "UNIT";
    const categoryName = unit?.category?.name || (typeof unit?.category === "string" ? unit?.category : "EXCAVATOR");

    // Title
    ctx.font = "bold 22px 'Segoe UI', Roboto, Helvetica, sans-serif";
    ctx.fillStyle = "#1e3a8a"; // Navy
    ctx.fillText(`LAPORAN PEMELIHARAAN UNIT - ${unitCode}`, titleX, 44);

    // Print Timestamp & Category Subtitle
    const now = new Date();
    const formattedDate = now.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    const formattedTime = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).replace(".", ":");

    ctx.font = "11.5px 'Segoe UI', Roboto, Helvetica, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(
      `Dicetak: ${formattedDate}, ${formattedTime} WIB   |   Kategori: ${categoryName.toUpperCase()}   |   Total: ${selectedItems.length} Komponen`,
      titleX,
      68
    );

    // Blue Line Divider
    const dividerY = 98;
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(32, dividerY);
    ctx.lineTo(width - 32, dividerY);
    ctx.stroke();

    // 4. Structured Unit Info Box (2 Kolom Rapi)
    const infoBoxY = 112;
    const infoBoxH = 56;
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.roundRect(32, infoBoxY, width - 64, infoBoxH, 8);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.stroke();

    const locName = unit?.location?.name || (typeof unit?.location === "string" ? unit?.location : "-");
    const opName = unit?.operator?.full_name || unit?.operator?.name || "-";
    const hoursVal = unit?.hours !== undefined && unit?.hours !== null ? unit?.hours : (unit?.hm || 0);
    const brandVal = unit?.brand || "-";
    const typeVal = unit?.type?.name || (typeof unit?.type === "string" ? unit?.type : "-");

    // Kolom Kiri
    ctx.font = "bold 11px 'Segoe UI', Roboto, Helvetica, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Lokasi", 48, infoBoxY + 22);
    ctx.fillText("Operator", 48, infoBoxY + 44);

    ctx.font = "600 11.5px 'Segoe UI', Roboto, Helvetica, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(`:  ${locName}`, 115, infoBoxY + 22);
    ctx.fillText(`:  ${opName}`, 115, infoBoxY + 44);

    // Kolom Kanan
    const col2X = 450;
    ctx.font = "bold 11px 'Segoe UI', Roboto, Helvetica, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Total Jam", col2X, infoBoxY + 22);
    ctx.fillText("Brand / Tipe", col2X, infoBoxY + 44);

    ctx.font = "600 11.5px 'Segoe UI', Roboto, Helvetica, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(`:  ${hoursVal} Jam`, col2X + 85, infoBoxY + 22);
    ctx.fillText(`:  ${brandVal}${typeVal && typeVal !== "-" ? ` (${typeVal})` : ""}`, col2X + 85, infoBoxY + 44);

    // 5. Table Header
    const tableHeaderY = 192;
    ctx.fillStyle = "#f1f5f9";
    ctx.beginPath();
    ctx.roundRect(32, tableHeaderY - 14, width - 64, 28, 6);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "bold 11px 'Segoe UI', Roboto, Helvetica, sans-serif";
    ctx.fillStyle = "#334155";
    ctx.fillText("KOMPONEN / APL", 48, tableHeaderY + 4);
    ctx.fillText("SISA WAKTU / GRAFIK PEMELIHARAAN", 250, tableHeaderY + 4);
    ctx.fillText("STATUS", width - 110, tableHeaderY + 4);

    // 6. Selected Items List & Bars
    let currentY = tableHeaderY + 30;
    const maxBarWidth = 320;

    selectedItems.forEach((item: any, idx: number) => {
      const isAlt = idx % 2 === 1;
      if (isAlt) {
        ctx.fillStyle = "#fcfdfd";
        ctx.fillRect(32, currentY - 14, width - 64, itemRowHeight);
      }

      // Component Name
      ctx.font = "bold 12px 'Segoe UI', Roboto, Helvetica, sans-serif";
      ctx.fillStyle = "#0f172a";
      ctx.fillText(item.name || "Komponen", 48, currentY + 6);

      // Progress Bar Calculation & 4 Status Levels (Ref: peringatan.tsx)
      const inputVal = item.input ?? 0;
      const vaultVal = item.vault && item.vault > 0 ? item.vault : 250;
      
      let barColor = "#10b981"; // Safe Green (Emerald)
      let statusText = "NORMAL";
      let statusBg = "#d1fae5";
      let statusTextColor = "#065f46";
      let hoursTextColor = "#1e293b";

      if (inputVal < 0) {
        // CRITICAL (< 0 Jam)
        barColor = "#ef4444";
        statusText = "CRITICAL";
        statusBg = "#fee2e2";
        statusTextColor = "#991b1b";
        hoursTextColor = "#ef4444";
      } else if (inputVal <= 10) {
        // URGENT (<= 10 - 0 Jam)
        barColor = "#f97316";
        statusText = "URGENT";
        statusBg = "#ffedd5";
        statusTextColor = "#c2410c";
        hoursTextColor = "#ea580c";
      } else if (inputVal <= 50) {
        // ATTENTION (<= 50 Jam)
        barColor = "#0284c7";
        statusText = "ATTENTION";
        statusBg = "#e0f2fe";
        statusTextColor = "#0369a1";
        hoursTextColor = "#0284c7";
      } else {
        // NORMAL (> 50 Jam)
        barColor = "#10b981";
        statusText = "NORMAL";
        statusBg = "#d1fae5";
        statusTextColor = "#065f46";
        hoursTextColor = "#1e293b";
      }

      // Background Track
      const barX = 250;
      const barY = currentY - 7;
      const barH = 16;
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.roundRect(barX, barY, maxBarWidth, barH, 8);
      ctx.fill();

      // Active Fill
      const ratio = Math.max(0, Math.min(1, inputVal / vaultVal));
      const fillWidth = Math.max(12, ratio * maxBarWidth);
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillWidth, barH, 8);
      ctx.fill();

      // Remaining Hours
      ctx.font = "bold 11px 'Segoe UI', Roboto, Helvetica, sans-serif";
      ctx.fillStyle = hoursTextColor;
      ctx.fillText(`${inputVal} Jam`, barX + maxBarWidth + 14, currentY + 5);

      // Status Pill
      const badgeX = width - 128;
      const badgeY = currentY - 9;
      const badgeW = 84;
      const badgeH = 20;
      ctx.fillStyle = statusBg;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();

      ctx.font = "bold 10px 'Segoe UI', Roboto, Helvetica, sans-serif";
      ctx.fillStyle = statusTextColor;
      ctx.textAlign = "center";
      ctx.fillText(statusText, badgeX + badgeW / 2, badgeY + 14);
      ctx.textAlign = "left";

      // Divider line
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, currentY + 22);
      ctx.lineTo(width - 32, currentY + 22);
      ctx.stroke();

      currentY += itemRowHeight;
    });

    // Convert Canvas to Blob & write to Clipboard
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Gagal membuat gambar laporan.");
          resolve(false);
          return;
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]);
          toast.success(`Gambar laporan ${unitCode} berhasil disalin! Siap di-paste (Ctrl+V / ⌘V).`, {
            duration: 3500,
            icon: "📋"
          });
          resolve(true);
        } catch (clipErr) {
          console.error("Clipboard copy failed:", clipErr);
          // Fallback download
          const link = document.createElement("a");
          link.download = `Laporan_Maintenance_${unitCode}_${formattedDate}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
          toast.success("Gambar laporan berhasil diunduh.");
          resolve(true);
        }
      }, "image/png");
    });
  } catch (err) {
    console.error("Failed to copy unit report image:", err);
    toast.error("Gagal menyalin gambar laporan.");
    return false;
  }
}
