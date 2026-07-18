export type AutosaveStatus =
  | "saving"
  | "saved"
  | "offline"
  | "needs-fix"
  | "conflict"
  | "error";

export interface VersionConflict {
  currentVersion: number;
  updatedAt: string;
}

export interface AutosaveState {
  status: AutosaveStatus;
  conflict: VersionConflict | null;
}

interface PendingSave<T> {
  generation: number;
  value: T;
}

interface AutosaveControllerOptions<T> {
  initialVersion: number;
  save: (value: T, expectedVersion: number) => Promise<number>;
  classifyError: (error: unknown) =>
    | { type: "conflict"; conflict: VersionConflict }
    | {
        type: "retryable";
      }
    | {
        type: "fatal";
      };
  onStateChange: (state: AutosaveState) => void;
  onSaved?: (value: T, version: number) => void;
  debounceMs?: number;
  retryDelaysMs?: number[];
  setTimeoutFn?: typeof window.setTimeout;
  clearTimeoutFn?: typeof window.clearTimeout;
}

const DEFAULT_RETRY_DELAYS = [2_000, 5_000, 15_000];

export class CertificateAutosaveController<T> {
  private readonly options: AutosaveControllerOptions<T>;
  private readonly debounceMs: number;
  private readonly retryDelays: number[];
  private readonly setTimer: typeof window.setTimeout;
  private readonly clearTimer: typeof window.clearTimeout;
  private timer: number | null = null;
  private pending: PendingSave<T> | null = null;
  private generation = 0;
  private version: number;
  private retryIndex = 0;
  private inFlight = false;
  private online = true;
  private allowed = true;
  private conflict: VersionConflict | null = null;
  private disposed = false;

  constructor(options: AutosaveControllerOptions<T>) {
    this.options = options;
    this.version = options.initialVersion;
    this.debounceMs = options.debounceMs ?? 1_200;
    this.retryDelays = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS;
    this.setTimer =
      options.setTimeoutFn ??
      (globalThis.setTimeout.bind(globalThis) as typeof window.setTimeout);
    this.clearTimer =
      options.clearTimeoutFn ??
      (globalThis.clearTimeout.bind(globalThis) as typeof window.clearTimeout);
  }

  schedule(value: T, allowed = true): void {
    if (this.disposed) return;
    this.pending = { generation: ++this.generation, value };
    this.allowed = allowed;
    this.clearScheduled();
    if (!allowed) {
      this.emit("needs-fix");
      return;
    }
    if (this.conflict) {
      this.emit("conflict");
      return;
    }
    if (!this.online) {
      this.emit("offline");
      return;
    }
    if (!this.inFlight) {
      this.emit("saving");
      this.timer = this.setTimer(() => void this.flush(), this.debounceMs);
    }
  }

  async flush(): Promise<boolean> {
    this.clearScheduled();
    if (
      this.disposed ||
      this.inFlight ||
      !this.pending ||
      !this.allowed ||
      this.conflict
    ) {
      return false;
    }
    if (!this.online) {
      this.emit("offline");
      return false;
    }

    const saving = this.pending;
    this.inFlight = true;
    this.emit("saving");
    try {
      const nextVersion = await this.options.save(saving.value, this.version);
      this.version = nextVersion;
      this.retryIndex = 0;
      if (this.pending?.generation === saving.generation) this.pending = null;
      this.options.onSaved?.(saving.value, nextVersion);
      this.inFlight = false;
      if (this.pending) {
        void this.flush();
      } else {
        this.emit("saved");
      }
      return true;
    } catch (error) {
      this.inFlight = false;
      const classified = this.options.classifyError(error);
      if (classified.type === "conflict") {
        this.conflict = classified.conflict;
        this.emit("conflict");
        return false;
      }
      if (classified.type === "retryable") {
        if (!this.online) {
          this.emit("offline");
          return false;
        }
        const delay = this.retryDelays[this.retryIndex];
        if (delay !== undefined) {
          this.retryIndex += 1;
          this.emit("offline");
          this.timer = this.setTimer(() => void this.flush(), delay);
        } else {
          this.emit("error");
        }
        return false;
      }
      this.emit("error");
      return false;
    }
  }

  setOnline(online: boolean): void {
    if (this.disposed) return;
    this.online = online;
    if (!online) {
      this.clearScheduled();
      if (this.pending) this.emit("offline");
      return;
    }
    if (this.pending && this.allowed && !this.conflict && !this.inFlight) {
      this.retryIndex = 0;
      void this.flush();
    }
  }

  setServerVersion(version: number): void {
    this.version = version;
    this.conflict = null;
    this.retryIndex = 0;
  }

  overwriteWithVersion(version: number): void {
    this.setServerVersion(version);
    if (this.pending && this.allowed) void this.flush();
  }

  pauseForConflict(conflict: VersionConflict): void {
    this.clearScheduled();
    this.conflict = conflict;
    this.emit("conflict");
  }

  retry(): void {
    this.retryIndex = 0;
    if (this.pending && this.allowed && !this.conflict) void this.flush();
  }

  hasPendingChanges(): boolean {
    return this.pending !== null || this.inFlight;
  }

  isSaving(): boolean {
    return this.inFlight;
  }

  cancelPending(): void {
    this.clearScheduled();
    this.pending = null;
    this.retryIndex = 0;
    if (!this.inFlight && !this.conflict) this.emit("saved");
  }

  getVersion(): number {
    return this.version;
  }

  dispose(): void {
    this.disposed = true;
    this.clearScheduled();
  }

  private clearScheduled(): void {
    if (this.timer !== null) {
      this.clearTimer(this.timer);
      this.timer = null;
    }
  }

  private emit(status: AutosaveStatus): void {
    this.options.onStateChange({ status, conflict: this.conflict });
  }
}

export const AUTOSAVE_STATUS_LABELS: Record<AutosaveStatus, string> = {
  saving: "Menyimpan",
  saved: "Tersimpan",
  offline: "Tersimpan lokal/offline",
  "needs-fix": "Perlu diperbaiki",
  conflict: "Konflik",
  error: "Gagal—Coba lagi",
};
