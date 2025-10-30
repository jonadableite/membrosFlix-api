import logger from "../logger/logger.js";

/**
 * Execute multiple async operations in parallel with error handling
 */
export async function executeInParallel<T>(
  operations: (() => Promise<T>)[],
  options: {
    continueOnError?: boolean;
    maxConcurrency?: number;
  } = {}
): Promise<T[]> {
  const { continueOnError = true, maxConcurrency = 10 } = options;
  const results: T[] = [];
  const errors: Error[] = [];

  // Process in batches to control concurrency
  for (let i = 0; i < operations.length; i += maxConcurrency) {
    const batch = operations.slice(i, i + maxConcurrency);

    const batchPromises = batch.map(async (operation, index) => {
      try {
        return await operation();
      } catch (error) {
        const errorMessage = `Operation ${i + index} failed: ${error}`;
        logger.error(errorMessage, { error });

        if (!continueOnError) {
          throw error;
        }

        errors.push(error as Error);
        return null;
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);

    batchResults.forEach((result) => {
      if (result.status === "fulfilled" && result.value !== null) {
        results.push(result.value);
      }
    });
  }

  if (errors.length > 0 && !continueOnError) {
    throw new Error(`Multiple operations failed: ${errors.length} errors`);
  }

  return results;
}

/**
 * Execute operations with timeout
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              errorMessage || `Operation timed out after ${timeoutMs}ms`
            )
          ),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );

      logger.warn(
        `Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`,
        {
          error: lastError.message,
          attempt: attempt + 1,
          delay,
        }
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Batch process items with concurrency control
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    concurrency?: number;
  } = {}
): Promise<R[]> {
  const { batchSize = 10, concurrency = 5 } = options;
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchPromises = batch.map((item) => () => processor(item));
    const batchResults = await executeInParallel(batchPromises, {
      maxConcurrency: concurrency,
    });

    results.push(...(batchResults as R[]));
  }

  return results;
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  operation: () => Promise<T>,
  operationName?: string
): Promise<{ result: T; duration: number }> {
  const start = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - start;

    logger.debug(
      `Operation ${operationName || "unnamed"} completed in ${duration}ms`
    );

    return { result, duration };
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(
      `Operation ${operationName || "unnamed"} failed after ${duration}ms`,
      { error }
    );
    throw error;
  }
}
