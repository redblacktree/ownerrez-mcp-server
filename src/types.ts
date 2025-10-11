export interface OwnerRezConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  user_id: number;
  refresh_token?: string;
  expires_in?: number;
}

export interface Booking {
  id: number;
  property_id: number;
  status: string;
  arrival: string;
  departure: string;
  guest_id?: number;
  total?: number;
  [key: string]: any;
}

export interface Property {
  id: number;
  name: string;
  active: boolean;
  address?: {
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  [key: string]: any;
}

export interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

export interface Quote {
  id: number;
  property_id: number;
  arrival: string;
  departure: string;
  [key: string]: any;
}

export interface Inquiry {
  id: number;
  property_id: number;
  message: string;
  [key: string]: any;
}

export interface Owner {
  id: number;
  name: string;
  active: boolean;
  [key: string]: any;
}

export interface User {
  id: number;
  email: string;
  name: string;
  [key: string]: any;
}

export interface WebhookSubscription {
  id: number;
  category: string;
  url: string;
  [key: string]: any;
}

export interface Review {
  id: number;
  property_id: number;
  rating: number;
  comment: string;
  [key: string]: any;
}

export interface Listing {
  id: number;
  property_id: number;
  name: string;
  description?: string;
  [key: string]: any;
}

export interface TagDefinition {
  id: number;
  name: string;
  active: boolean;
  [key: string]: any;
}

export interface FieldDefinition {
  id: number;
  name: string;
  type: string;
  active: boolean;
  [key: string]: any;
}
