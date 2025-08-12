import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Copy, Check, Download, QrCode } from "lucide-react";
import {
  generateSimpleQRCode,
  generateDecoratedQRCode,
  downloadQRCode,
} from "~/lib/utils/qr-generator";

interface ShareTripDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
}

export function ShareTripDialog({
  isOpen,
  onOpenChange,
  shareUrl,
}: ShareTripDialogProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Generate QR code when dialog opens and URL is available
  useEffect(() => {
    async function generateQR() {
      if (!shareUrl || !isOpen) return;

      setIsGeneratingQR(true);
      try {
        const qrDataUrl = await generateSimpleQRCode(shareUrl);
        setQrCode(qrDataUrl);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      } finally {
        setIsGeneratingQR(false);
      }
    }

    generateQR();
  }, [shareUrl, isOpen]);

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleDownloadQR = async () => {
    if (!shareUrl) return;

    setIsDownloading(true);
    try {
      const decoratedQRUrl = await generateDecoratedQRCode({
        url: shareUrl,
        title: "Globe Trotter",
        subtitle: "Trip Share",
        filename: "trip-share-qr",
      });
      downloadQRCode(decoratedQRUrl, "trip-share-qr");
    } catch (error) {
      console.error("Failed to download QR code:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Trip</DialogTitle>
          <DialogDescription>
            Share your trip with others using this link. Anyone with the link
            can view your trip.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Link input and copy button */}
          <div className="flex items-center space-x-2">
            <Input
              readOnly
              value={shareUrl}
              className="flex-1 bg-muted"
              placeholder="Generating share URL..."
            />
            <Button
              onClick={handleCopyShareUrl}
              disabled={!shareUrl}
              size="sm"
              variant="outline"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* QR Code Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <QrCode className="w-4 h-4" />
              <span>Or scan QR code</span>
            </div>

            {/* QR Code Display */}
            <div className="flex justify-center">
              {isGeneratingQR ? (
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : qrCode ? (
                <img
                  src={qrCode}
                  alt="Trip share QR code"
                  className="w-48 h-48 border rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  <QrCode className="w-12 h-12" />
                </div>
              )}
            </div>

            {/* Download QR Button */}
            <Button
              onClick={handleDownloadQR}
              disabled={!shareUrl || isGeneratingQR || isDownloading}
              variant="outline"
              size="sm"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </>
              )}
            </Button>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
