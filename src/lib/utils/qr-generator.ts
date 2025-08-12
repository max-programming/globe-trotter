import QRCode from "qrcode";

export interface DecoratedQRCodeOptions {
  url: string;
  title?: string;
  subtitle?: string;
  filename?: string;
}

export async function generateDecoratedQRCode(
  options: DecoratedQRCodeOptions
): Promise<string> {
  const {
    url,
    title = "Globe Trotter",
    subtitle,
    filename = "globe-trotter-qr",
  } = options;

  // Create canvas for the decorated QR code
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  // Set canvas size - making it large enough for decoration
  const canvasSize = 600;
  const qrSize = 300;
  const padding = 60;

  canvas.width = canvasSize;
  canvas.height = canvasSize + 120; // Extra space for text

  // Fill background with card color (white/dark theme aware)
  const isDark = document.documentElement.classList.contains("dark");
  const bgColor = isDark ? "#1a1a1a" : "#ffffff";
  const textColor = isDark ? "#e5e5e5" : "#1f2937";
  const accentColor = "#7c3aed"; // Primary color from CSS

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add subtle shadow/border
  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = bgColor;
  ctx.roundRect(20, 20, canvas.width - 40, canvas.height - 40, 16);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Generate QR code
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: qrSize,
    margin: 2,
    color: {
      dark: textColor,
      light: bgColor,
    },
    errorCorrectionLevel: "H",
  });

  // Load and draw QR code
  const qrImage = new Image();
  await new Promise<void>(resolve => {
    qrImage.onload = () => resolve();
    qrImage.src = qrDataUrl;
  });

  // Draw QR code centered
  const qrX = (canvasSize - qrSize) / 2;
  const qrY = padding + 60; // Leave space for title
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  // Draw title
  ctx.fillStyle = accentColor;
  ctx.font =
    'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(title, canvasSize / 2, 50);

  // Draw subtitle if provided
  if (subtitle) {
    ctx.fillStyle = textColor;
    ctx.font =
      '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(subtitle, canvasSize / 2, qrY + qrSize + 30);
  }

  // Draw URL
  ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
  ctx.font =
    '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
  const urlText = url.length > 50 ? url.substring(0, 47) + "..." : url;
  ctx.fillText(urlText, canvasSize / 2, qrY + qrSize + (subtitle ? 55 : 35));

  // Add small branding text
  ctx.fillStyle = accentColor;
  ctx.font =
    '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    "Scan to view trip",
    canvasSize / 2,
    qrY + qrSize + (subtitle ? 80 : 60)
  );

  return canvas.toDataURL("image/png");
}

export function downloadQRCode(
  dataUrl: string,
  filename: string = "globe-trotter-qr"
): void {
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateSimpleQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 256,
    margin: 2,
    errorCorrectionLevel: "H",
  });
}
