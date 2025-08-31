declare const ZXing: {
  BrowserMultiFormatReader: any;
};

interface ScanResult {
  text: string;
  timestamp: Date;
}

class QRScannerApp {
  private currentScreen = "welcome";
  private scanMode: "camera" | "file" = "camera";
  private codeReader: any = null; // ZXing library type not available
  private stream: MediaStream | null = null;
  private lastResult: ScanResult | null = null;

  constructor() {
    console.log("QR Scanner 서비스가 로드되었습니다.");
    this.initializeApp();
  }

  private initializeApp(): void {
    this.setupEventListeners();
    this.showScreen("welcome");
  }

  private setupEventListeners(): void {
    // Navigation controls
    const cameraModeBtn = document.getElementById("camera-mode") as HTMLButtonElement;
    const fileModeBtn = document.getElementById("file-mode") as HTMLButtonElement;

    if (cameraModeBtn) {
      cameraModeBtn.addEventListener("click", () => this.setScanMode("camera"));
    }
    if (fileModeBtn) {
      fileModeBtn.addEventListener("click", () => this.setScanMode("file"));
    }

    // Main action buttons
    const startScanBtn = document.getElementById("start-scan") as HTMLButtonElement;
    const stopCameraBtn = document.getElementById("stop-camera") as HTMLButtonElement;
    const backFromFileBtn = document.getElementById("back-from-file") as HTMLButtonElement;

    if (startScanBtn) {
      startScanBtn.addEventListener("click", () => this.startScanning());
    }
    if (stopCameraBtn) {
      stopCameraBtn.addEventListener("click", () => this.stopCamera());
    }
    if (backFromFileBtn) {
      backFromFileBtn.addEventListener("click", () => this.showScreen("welcome"));
    }

    // File upload
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    const fileDropZone = document.getElementById("file-drop") as HTMLElement;

    if (fileInput) {
      fileInput.addEventListener("change", (e) => this.handleFileSelect(e));
    }
    if (fileDropZone) {
      fileDropZone.addEventListener("click", () => fileInput?.click());
      fileDropZone.addEventListener("drop", (e) => this.handleFileDrop(e));
      fileDropZone.addEventListener("dragover", (e) => e.preventDefault());
    }

    // Result actions
    const copyBtn = document.getElementById("copy-result") as HTMLButtonElement;
    const actionBtn = document.getElementById("action-result") as HTMLButtonElement;
    const scanAgainBtn = document.getElementById("scan-again") as HTMLButtonElement;
    const resetBtn = document.getElementById("reset-app") as HTMLButtonElement;

    if (copyBtn) {
      copyBtn.addEventListener("click", () => this.copyResult());
    }
    if (actionBtn) {
      actionBtn.addEventListener("click", () => this.performAction());
    }
    if (scanAgainBtn) {
      scanAgainBtn.addEventListener("click", () => this.startScanning());
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetApp());
    }

    // Error dismissal
    const dismissErrorBtn = document.getElementById("dismiss-error") as HTMLButtonElement;
    if (dismissErrorBtn) {
      dismissErrorBtn.addEventListener("click", () => this.hideError());
    }
  }

  private setScanMode(mode: "camera" | "file"): void {
    this.scanMode = mode;
    this.updateNavButtons();
  }

  private updateNavButtons(): void {
    const cameraModeBtn = document.getElementById("camera-mode") as HTMLButtonElement;
    const fileModeBtn = document.getElementById("file-mode") as HTMLButtonElement;

    if (cameraModeBtn && fileModeBtn) {
      cameraModeBtn.classList.toggle("btn-primary", this.scanMode === "camera");
      cameraModeBtn.classList.toggle("btn-ghost", this.scanMode !== "camera");
      fileModeBtn.classList.toggle("btn-primary", this.scanMode === "file");
      fileModeBtn.classList.toggle("btn-ghost", this.scanMode !== "file");
    }
  }

  private showScreen(screenName: string): void {
    // Hide all screens
    const screens = document.querySelectorAll<HTMLElement>(".screen");
    screens.forEach((screen) => screen.classList.add("hidden"));

    // Show target screen
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
      targetScreen.classList.remove("hidden");
      this.currentScreen = screenName;
    }

    this.hideError();
  }

  private showLoading(show: boolean, message = "Loading..."): void {
    const loadingOverlay = document.getElementById("loading-overlay") as HTMLElement;
    const loadingText = document.querySelector(".loading-text") as HTMLElement;

    if (loadingOverlay) {
      if (show) {
        loadingOverlay.classList.remove("hidden");
        if (loadingText) {
          loadingText.textContent = message;
        }
      } else {
        loadingOverlay.classList.add("hidden");
      }
    }
  }

  private showError(message: string): void {
    const errorDisplay = document.getElementById("error-display") as HTMLElement;
    const errorMessage = document.getElementById("error-message") as HTMLElement;

    if (errorDisplay && errorMessage) {
      errorMessage.textContent = message;
      errorDisplay.classList.remove("hidden");

      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.hideError();
      }, 5000);
    }
  }

  private hideError(): void {
    const errorDisplay = document.getElementById("error-display") as HTMLElement;
    if (errorDisplay) {
      errorDisplay.classList.add("hidden");
    }
  }

  private async startScanning(): Promise<void> {
    if (this.scanMode === "camera") {
      await this.startCameraScanning();
    } else {
      this.showScreen("file");
    }
  }

  private async startCameraScanning(): Promise<void> {
    try {
      this.showLoading(true, "Initializing camera...");

      // Check if browser supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported by this browser");
      }

      // Initialize ZXing code reader
      if (!this.codeReader) {
        this.codeReader = new ZXing.BrowserMultiFormatReader();
      }

      // Get video devices
      const videoDevices = await this.codeReader.listVideoInputDevices();
      if (videoDevices.length === 0) {
        throw new Error("No camera found on this device");
      }

      // Prefer back camera
      const backCamera = videoDevices.find(
        (device: MediaDeviceInfo) =>
          device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("rear")
      );
      const selectedDevice = backCamera || videoDevices[0];

      this.showScreen("camera");
      this.showLoading(false);

      const videoElement = document.getElementById("camera-video") as HTMLVideoElement;
      if (videoElement) {
        await this.codeReader.decodeFromVideoDevice(
          selectedDevice.deviceId,
          videoElement,
          (result: any, error: any) => {
            // ZXing callback types not available
            if (result) {
              this.handleScanResult(result.getText());
            }
            if (error && error.name !== "NotFoundException") {
              console.warn("Scan error:", error);
            }
          }
        );
      }
    } catch (error) {
      this.showLoading(false);
      console.error("Camera initialization error:", error);

      let errorMessage = "Failed to initialize camera";
      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMessage = "Camera permission denied. Please allow camera access and try again.";
        } else if (error.name === "NotFoundError" || error.message.includes("No camera found")) {
          errorMessage = "No camera found on this device.";
        } else if (error.name === "NotSupportedError") {
          errorMessage = "Camera is not supported on this device.";
        } else {
          errorMessage = `Camera error: ${error.message}`;
        }
      }

      this.showError(errorMessage);
      this.showScreen("welcome");
    }
  }

  private stopCamera(): void {
    if (this.codeReader) {
      this.codeReader.reset();
    }
    this.showScreen("welcome");
  }

  private handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processImageFile(file);
    }
  }

  private handleFileDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.processImageFile(file);
    }
  }

  private async processImageFile(file: File): Promise<void> {
    try {
      // Validate file
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file (PNG, JPG, etc.)");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size too large. Please select a file smaller than 10MB.");
      }

      this.showLoading(true, "Processing image...");

      // Initialize code reader if needed
      if (!this.codeReader) {
        this.codeReader = new ZXing.BrowserMultiFormatReader();
      }

      const imageUrl = URL.createObjectURL(file);
      const result = await this.codeReader.decodeFromImageUrl(imageUrl);

      URL.revokeObjectURL(imageUrl);
      this.showLoading(false);

      this.handleScanResult(result.getText());
    } catch (error) {
      this.showLoading(false);
      console.error("File processing error:", error);

      let errorMessage = "Failed to process image file";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (errorMessage.includes("NotFoundException")) {
        errorMessage = "No QR code found in the selected image. Please try a different image.";
      }

      this.showError(errorMessage);
    }
  }

  private handleScanResult(text: string): void {
    this.lastResult = {
      text: text,
      timestamp: new Date(),
    };

    this.stopCamera();
    this.displayResult(this.lastResult);
  }

  private displayResult(result: ScanResult): void {
    // Update result text
    const resultText = document.getElementById("result-text") as HTMLElement;
    if (resultText) {
      resultText.textContent = result.text;
    }

    // Update timestamp
    const resultTimestamp = document.getElementById("result-timestamp") as HTMLElement;
    if (resultTimestamp) {
      resultTimestamp.textContent = `Scanned on ${result.timestamp.toLocaleString()}`;
    }

    // Determine result type and update chip
    const resultType = this.getResultType(result.text);
    const resultChip = document.getElementById("result-type-chip") as HTMLElement;
    if (resultChip) {
      resultChip.textContent = `${resultType.icon} ${resultType.type}`;
    }

    // Show/hide action button
    const actionBtn = document.getElementById("action-result") as HTMLButtonElement;
    if (actionBtn) {
      if (resultType.action) {
        actionBtn.textContent = `${resultType.icon} ${resultType.action}`;
        actionBtn.style.display = "inline-flex";
      } else {
        actionBtn.style.display = "none";
      }
    }

    this.showScreen("result");
  }

  private getResultType(text: string): {
    type: string;
    icon: string;
    action?: string;
  } {
    if (this.isUrl(text)) {
      return { type: "URL", icon: "🔗", action: "Open Link" };
    }
    if (this.isEmail(text)) {
      return { type: "Email", icon: "📧", action: "Send Email" };
    }
    if (this.isPhone(text)) {
      return { type: "Phone", icon: "📞", action: "Call" };
    }
    return { type: "Text", icon: "📝" };
  }

  private isUrl(text: string): boolean {
    try {
      new URL(text);
      return text.startsWith("http://") || text.startsWith("https://");
    } catch {
      return false;
    }
  }

  private isEmail(text: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  }

  private isPhone(text: string): boolean {
    return /^[\+]?[0-9\-\(\)\s]+$/.test(text) && text.replace(/\D/g, "").length >= 10;
  }

  private async copyResult(): Promise<void> {
    if (!this.lastResult) return;

    try {
      await navigator.clipboard.writeText(this.lastResult.text);

      // Update button text temporarily
      const copyBtn = document.getElementById("copy-result") as HTMLButtonElement;
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "✅ Copied!";
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to copy:", error);
      this.showError("Failed to copy to clipboard");
    }
  }

  private performAction(): void {
    if (!this.lastResult) return;

    const text = this.lastResult.text;

    if (this.isUrl(text)) {
      window.open(text, "_blank");
    } else if (this.isEmail(text)) {
      window.location.href = `mailto:${text}`;
    } else if (this.isPhone(text)) {
      window.location.href = `tel:${text}`;
    }
  }

  private resetApp(): void {
    this.stopCamera();
    this.lastResult = null;
    this.showScreen("welcome");
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", (): void => {
  new QRScannerApp();
});
