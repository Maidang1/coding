export interface PendingConfirmation {
  toolName: string;
  description: string;
  resolve: (confirmed: boolean) => void;
}

export class ConfirmationManager {
  private pendingConfirmation: PendingConfirmation | null = null;

  requestConfirmation(toolName: string, description: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.pendingConfirmation = {
        toolName,
        description,
        resolve,
      };
    });
  }

  confirm(): void {
    if (this.pendingConfirmation) {
      this.pendingConfirmation.resolve(true);
      this.pendingConfirmation = null;
    }
  }

  reject(): void {
    if (this.pendingConfirmation) {
      this.pendingConfirmation.resolve(false);
      this.pendingConfirmation = null;
    }
  }

  getPendingConfirmation(): Omit<PendingConfirmation, 'resolve'> | null {
    if (!this.pendingConfirmation) {
      return null;
    }
    return {
      toolName: this.pendingConfirmation.toolName,
      description: this.pendingConfirmation.description,
    };
  }
}
