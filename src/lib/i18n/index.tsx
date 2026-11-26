"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ensureLocalStorageMigrated } from "@/lib/storage/migrate";

export type Locale = "en" | "es";

type Dict = Record<string, string>;

const dictionaries: Record<Locale, Dict> = {
  en: {
    tagline: "Free world radio",
    discover: "Discover",
    stations: "Stations",
    favorites: "Favorites",
    stats: "Stats",
    collections: "Collections",
    explore: "Explore",
    search: "Search",
    openSearch: "Open search (Ctrl+K)",
    language: "Language",
    yourListening: "Your listening",
    listeningStats: "Listening stats",
    statsDesc: "A local snapshot of your SYNTV RADIO activity. Favorites and recents stay on this device.",
    recentlyPlayed: "Recently played",
    listeningTime: "Listening time",
    sessions: "Sessions",
    topCountries: "Top countries",
    topGenres: "Top genres",
    noCountryStats: "Play or save stations to see country stats.",
    noGenreStats: "Genre stats will appear as you listen.",
    favoriteStations: "Favorite stations",
    worldExplorer: "World explorer",
    exploreByCountry: "Explore by country",
    exploreDesc: "Jump into live radio by region. Pick a country to browse stations.",
    stationsCount: "stations",
    youreOffline: "You're offline",
    offlineDesc: "SYNTV RADIO needs an internet connection to load live station streams. Check your connection and try again.",
    goToDiscover: "Go to Discover",
    yourLibrary: "Your library",
    collectionsDesc: "Build your own station sets. Collections are saved locally on this device.",
    createCollection: "Create collection",
    create: "Create",
    exportJson: "Export JSON",
    share: "Share",
    importJson: "Import JSON",
    noCollections: "No collections yet. Create one and add stations from your favorites or recents.",
    delete: "Delete",
    addStations: "Add stations",
    added: "Added",
    add: "Add",
    mapCaption: "Bubble size reflects station count. Click a bubble to browse that country.",
    syncLocalOnly: "Local-only mode",
    syncDesc: "Favorites, recents, collections, and stats are stored on this device. Cloud sync can be added with Supabase/Neon when credentials are configured.",
    interactiveGlobe: "Interactive 3D globe",
    selectedCountry: "Selected country",
    browseStations: "Browse stations",
    clearSelection: "Clear selection",
  },
  es: {
    tagline: "Radio mundial gratis",
    discover: "Descubrir",
    stations: "Estaciones",
    favorites: "Favoritos",
    stats: "Estadísticas",
    collections: "Colecciones",
    explore: "Explorar",
    search: "Buscar",
    openSearch: "Abrir búsqueda (Ctrl+K)",
    language: "Idioma",
    yourListening: "Tu escucha",
    listeningStats: "Estadísticas de escucha",
    statsDesc: "Una instantánea local de tu actividad en SYNTV RADIO. Favoritos y recientes se guardan en este dispositivo.",
    recentlyPlayed: "Reproducidos recientemente",
    listeningTime: "Tiempo de escucha",
    sessions: "Sesiones",
    topCountries: "Países principales",
    topGenres: "Géneros principales",
    noCountryStats: "Reproduce o guarda estaciones para ver estadísticas por país.",
    noGenreStats: "Las estadísticas de géneros aparecerán al escuchar.",
    favoriteStations: "Estaciones favoritas",
    worldExplorer: "Explorador mundial",
    exploreByCountry: "Explorar por país",
    exploreDesc: "Entra a la radio en vivo por región. Elige un país para explorar estaciones.",
    stationsCount: "estaciones",
    youreOffline: "Estás sin conexión",
    offlineDesc: "SYNTV RADIO necesita conexión a internet para cargar transmisiones en vivo. Revisa tu conexión e inténtalo de nuevo.",
    goToDiscover: "Ir a Descubrir",
    yourLibrary: "Tu biblioteca",
    collectionsDesc: "Crea tus propios conjuntos de estaciones. Las colecciones se guardan localmente en este dispositivo.",
    createCollection: "Crear colección",
    create: "Crear",
    exportJson: "Exportar JSON",
    share: "Compartir",
    importJson: "Importar JSON",
    noCollections: "Aún no hay colecciones. Crea una y añade estaciones desde favoritos o recientes.",
    delete: "Eliminar",
    addStations: "Añadir estaciones",
    added: "Añadido",
    add: "Añadir",
    mapCaption: "El tamaño de la burbuja refleja el número de estaciones. Haz clic para explorar ese país.",
    syncLocalOnly: "Solo modo local",
    syncDesc: "Favoritos, recientes, colecciones y estadísticas se guardan en este dispositivo. La sincronización en la nube puede añadirse con Supabase/Neon cuando se configuren credenciales.",
    interactiveGlobe: "Globo 3D interactivo",
    selectedCountry: "País seleccionado",
    browseStations: "Explorar estaciones",
    clearSelection: "Borrar selección",
  },
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);
const LOCALE_KEY = "syntv-radio:locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    ensureLocalStorageMigrated();
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === "en" || stored === "es") {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate locale */
      setLocaleState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_KEY, next);
    document.documentElement.lang = next;
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string) => dictionaries[locale][key] ?? dictionaries.en[key] ?? key,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
