interface Job<T> {
  name: string;
  run: () => Promise<T>;
}

// In-memory queue adapter. Replace with BullMQ/SQS/Cloud Tasks in production.
export async function enqueueJob<T>(job: Job<T>): Promise<T> {
  return await job.run();
}
