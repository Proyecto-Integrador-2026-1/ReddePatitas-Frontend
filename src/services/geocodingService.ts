// services/geocodingService.ts

export interface Suggestion {
  displayName: string;
  lat: number;
  lon: number;
  placeId: number;
}

/**
 * Obtiene sugerencias de lugares según el texto ingresado
 */
export async function getPlaceSuggestions(query: string): Promise<Suggestion[]> {
  if (!query || query.trim().length < 3) return [];

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=0&namedetails=0&accept-language=es`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      placeId: item.place_id,
    }));
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}

/**
 * Guarda una búsqueda en el historial de localStorage
 */
export function saveSearchToHistory(query: string, lat: number, lon: number): void {
  const historyKey = 'rdp_search_history';
  const maxHistory = 10;

  try {
    const existing = localStorage.getItem(historyKey);
    let history: Array<{ query: string; lat: number; lon: number; timestamp: number }> = existing
      ? JSON.parse(existing)
      : [];

    // Eliminar si ya existe la misma búsqueda
    history = history.filter((item) => item.query.toLowerCase() !== query.toLowerCase());

    // Agregar al principio
    history.unshift({ query, lat, lon, timestamp: Date.now() });

    // Limitar a maxHistory elementos
    if (history.length > maxHistory) {
      history = history.slice(0, maxHistory);
    }

    localStorage.setItem(historyKey, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving search to history:', error);
  }
}

/**
 * Obtiene el historial de búsquedas
 */
export function getSearchHistory(): Array<{ query: string; lat: number; lon: number; timestamp: number }> {
  const historyKey = 'rdp_search_history';
  try {
    const existing = localStorage.getItem(historyKey);
    return existing ? JSON.parse(existing) : [];
  } catch {
    return [];
  }
}

/**
 * Elimina una búsqueda del historial
 */
export function removeSearchFromHistory(index: number): void {
  const historyKey = 'rdp_search_history';
  try {
    const existing = localStorage.getItem(historyKey);
    if (existing) {
      const history = JSON.parse(existing);
      history.splice(index, 1);
      localStorage.setItem(historyKey, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error removing search from history:', error);
  }
}

/**
 * Limpia todo el historial de búsquedas
 */
export function clearSearchHistory(): void {
  localStorage.removeItem('rdp_search_history');
}