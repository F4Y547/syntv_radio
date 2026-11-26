export interface Station {
  id: string;
  name: string;
  url: string;
  urlResolved: string;
  homepage: string;
  favicon: string;
  tags: string[];
  country: string;
  countryCode: string;
  state: string;
  language: string;
  votes: number;
  codec: string;
  bitrate: number;
  clickCount: number;
  clickTrend: number;
  isOnline: boolean;
}

export interface StationSearchParams {
  search?: string;
  country?: string;
  tag?: string;
  limit?: number;
  offset?: number;
  order?: "clickcount" | "votes" | "name" | "clicktrend";
  reverse?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  stations: Station[];
  createdAt: number;
}
