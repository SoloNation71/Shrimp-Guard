import { useQuery } from '@tanstack/react-query';
import { fetchLatestSensorData, fetchSensorHistory } from '@/api/sensors';

export function useLatestSensor(pondId: number) {
  return useQuery({
    queryKey: ['sensor', 'latest', pondId],
    queryFn: () => fetchLatestSensorData(pondId),
    refetchInterval: 30_000, // poll every 30s
    staleTime: 15_000,
  });
}

export function useSensorHistory(pondId: number, hours = 24) {
  return useQuery({
    queryKey: ['sensor', 'history', pondId, hours],
    queryFn: () => fetchSensorHistory(pondId, hours),
    staleTime: 60_000,
  });
}
