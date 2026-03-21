/** 统一错误处理：捕获异步错误，执行回调或返回 fallback */
export const handleAsyncError = async <T>(
  fn: () => Promise<T>,
  fallback: T,
  onError?: (error: unknown) => void
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    onError?.(error);
    if (import.meta.env.DEV && !onError) console.warn('[errorHandler]', error);
    return fallback;
  }
};
