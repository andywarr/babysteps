import { useEffect, useRef } from "react";

type IntervalHandler = () => void;

export function useInterval(callback: IntervalHandler, delay: number) {
  const savedCallback = useRef<IntervalHandler | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return undefined;
    }
    const id = setInterval(() => savedCallback.current?.(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
