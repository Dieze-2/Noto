import { useSyncExternalStore } from "react";

const KEY = "noto_gestures_enabled";

function getSnapshot(): boolean {
  return localStorage.getItem(KEY) !== "false"; // default true
}

function subscribe(cb: () => void) {
  window.addEventListener("gestureschange", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("gestureschange", cb);
    window.removeEventListener("storage", cb);
  };
}

export function useGestures(): [boolean, (v: boolean) => void] {
  const enabled = useSyncExternalStore(subscribe, getSnapshot);
  const setEnabled = (v: boolean) => {
    localStorage.setItem(KEY, v ? "true" : "false");
    window.dispatchEvent(new Event("gestureschange"));
  };
  return [enabled, setEnabled];
}
