// Mobile In-App Action & Network Logger

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'API_REQ' | 'API_RES' | 'API_ERR' | 'WARN' | 'ERROR';
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

    // Print to developer terminal
    const prefix = `[${entry.timestamp}] [${type}] [${tag}]`;
    if (type === 'API_ERR' || type === 'ERROR') {
      console.error(prefix, message, details ? JSON.stringify(details) : '');
    } else if (type === 'WARN') {
      console.warn(prefix, message, details ? JSON.stringify(details) : '');
    } else {
      console.log(prefix, message, details ? JSON.stringify(details) : '');
    }

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Notify UI listeners
    this.listeners.forEach((listener) => listener([...this.logs]));
  }

  info(tag: string, message: string, details?: any) {
    this.addLog('INFO', tag, message, details);
  }

  apiReq(method: string, url: string, data?: any) {
    this.addLog('API_REQ', 'API', `${method.toUpperCase()} ${url}`, data);
  }

  apiRes(status: number, url: string, data?: any) {
    this.addLog('API_RES', 'API', `HTTP ${status} <- ${url}`, data);
  }

  apiErr(url: string, errorMsg: string, details?: any) {
    this.addLog('API_ERR', 'API', `FAILED <- ${url} : ${errorMsg}`, details);
  }

  warn(tag: string, message: string, details?: any) {
    this.addLog('WARN', tag, message, details);
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

