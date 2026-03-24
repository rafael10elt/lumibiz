import { useState } from 'react';

export const useGeolocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocalizacao nao e suportada por este navegador.';
        setError(msg);
        setLoading(false);
        reject(new Error(msg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoading(false);
          resolve(position);
        },
        (err) => {
          const msg = `Erro ao obter localizacao: ${err.message}`;
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true }
      );
    });
  };

  return { getCurrentLocation, loading, error };
};
