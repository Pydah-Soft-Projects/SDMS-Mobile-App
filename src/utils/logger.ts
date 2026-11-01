// Mobile In-App Action & Network Error Logger (Errors Only)

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'API_ERR' | 'ERROR';
  tag: string;
  message: string;
  details?: any;
}

type LogListener = (logs: LogEntry[]) => void;

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 100;

  private formatTime(): string {
    const d = new Date();
    return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
  }

  private addLog(type: LogEntry['type'], tag: string, message: string, details?: any) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: this.formatTime(),
      type,
      tag,
      message,
      details,
    };

    // Print ONLY errors to developer terminal
    const prefix = `[${entry.timestamp}] [ERROR] [${tag}]`;
    console.error(prefix, message, details ? JSON.stringify(details) : '');

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Notify UI listeners
    this.listeners.forEach((listener) => listener([...this.logs]));
  }

  // Routine tasks are ignored to keep terminal and UI clean
  info(_tag: string, _message: string, _details?: any) {
    // Suppressed: only errors are logged
  }

  apiReq(_method: string, _url: string, _data?: any) {
    // Suppressed: only errors are logged
  }

  apiRes(_status: number, _url: string, _data?: any) {
    // Suppressed: only errors are logged
  }

  warn(_tag: string, _message: string, _details?: any) {
    // Suppressed: only errors are logged
  }

  apiErr(url: string, errorMsg: string, details?: any) {
    this.addLog('API_ERR', 'API', `FAILED <- ${url} : ${errorMsg}`, details);
  }

  error(tag: string, message: string, details?: any) {
    this.addLog('ERROR', tag, message, details);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.listeners.forEach((listener) => listener([]));
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => this.listeners.delete(listener);
  }
}

export const logger = new LoggerService();
export default logger;
