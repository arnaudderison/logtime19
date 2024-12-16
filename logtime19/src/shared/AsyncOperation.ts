import { useState, Dispatch, SetStateAction } from "react";

export type AsyncOperation<T = unknown> = T & {
  busy: boolean;
  errorMessage?: string;
};

export function useAsyncOperation<T = unknown>(
  initialState: T,
  busy = false
): [AsyncOperation<T>, Dispatch<SetStateAction<AsyncOperation<T>>>] {
  return useState<AsyncOperation<T>>({ ...initialState, busy });
}

