"use client";

import { useRef, useState } from "react";
import {
  isNearbyCoordinates,
  type NearbyCoordinates,
} from "@/lib/nearby-search";
import type { SearchPillLocationStatus } from "./SearchPillPanels";

function locationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === 1) {
    return "Location access was denied. Choose a city to search instead.";
  }
  if (error.code === 2) {
    return "Your location could not be determined. Choose a city to search instead.";
  }
  return "The location request timed out. Choose a city to search instead.";
}

export function useNearbyLocation() {
  const [coordinates, setCoordinates] = useState<NearbyCoordinates | null>(null);
  const [status, setStatus] = useState<SearchPillLocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  function reset() {
    requestId.current += 1;
    setCoordinates(null);
    setStatus("idle");
    setError(null);
  }

  function requestLocation() {
    const activeRequestId = requestId.current + 1;
    requestId.current = activeRequestId;
    setCoordinates(null);
    setStatus("loading");
    setError(null);

    if (!navigator.geolocation) {
      setStatus("error");
      setError(
        "Location is unavailable in this browser. Choose a city to search instead.",
      );
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (requestId.current !== activeRequestId) return;
          const currentCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          if (!isNearbyCoordinates(currentCoordinates)) {
            setStatus("error");
            setError(
              "Your location could not be used. Choose a city to search instead.",
            );
            return;
          }
          setCoordinates(currentCoordinates);
          setStatus("ready");
        },
        (locationError) => {
          if (requestId.current !== activeRequestId) return;
          setStatus("error");
          setError(locationErrorMessage(locationError));
        },
        { enableHighAccuracy: false, maximumAge: 0, timeout: 10_000 },
      );
    } catch {
      if (requestId.current === activeRequestId) {
        setStatus("error");
        setError(
          "Location is unavailable in this browser. Choose a city to search instead.",
        );
      }
    }
  }

  return { coordinates, error, requestLocation, reset, status };
}
