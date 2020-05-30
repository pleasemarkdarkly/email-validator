import { EventEmitter } from "events";

type QueueEvents = {
  promiseResolved: (resolveValue: any) => void;
  promiseRejected: (rejectValue: any) => void;
};

export class Queue extends EventEmitter {
  on<T extends keyof QueueEvents>(event: T, listener: QueueEvents[T]): this {
    return super.on(event, listener);
  }
  emit<T extends keyof QueueEvents>(
    event: T,
    ...args: Parameters<QueueEvents[T]>
  ): boolean {
    return super.emit(event, ...args);
  }



  currentlyExecuting = 0;
  pendingQueue: (() => Promise<any>)[] = [];

  get pending(){
    return this.pendingQueue.length;
  }

  constructor(public concurrency: number = 1) {
    super();
  }

  add(fn: () => Promise<any>) {
    this.pendingQueue.push(fn);
    this.tryProcessOne();
  }

  async tryProcessOne() {
    if (this.pendingQueue.length && (this.currentlyExecuting < this.concurrency)) {
      const nextPending = this.pendingQueue.shift()!;
      this.currentlyExecuting++;
      try {
        const result = await nextPending();
        this.emit("promiseResolved", result);
        this.tryProcessOne();
      } catch (e) {
        this.emit("promiseRejected", e);
        this.tryProcessOne();
      } finally {
        this.currentlyExecuting--;
      }
    }
  }
}
