import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { OwnerRezConfig, OAuthTokenResponse } from './types.js';

export class OwnerRezClient {
  private axiosInstance: AxiosInstance;
  private config: OwnerRezConfig;
  private baseURL = 'https://api.ownerrez.com';

  constructor(config: OwnerRezConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OwnerRez-MCP-Server/1.0'
      }
    });

    if (config.accessToken) {
      this.setAccessToken(config.accessToken);
    }
  }

  setAccessToken(token: string): void {
    this.config.accessToken = token;
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
    });

    if (state) {
      params.append('state', state);
    }

    return `https://app.ownerrez.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    
    const response = await axios.post<OAuthTokenResponse>(
      `${this.baseURL}/oauth/access_token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
      }).toString(),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'OwnerRez-MCP-Server/1.0',
          'Accept': 'application/json'
        }
      }
    );

    this.setAccessToken(response.data.access_token);
    return response.data;
  }

  async revokeToken(token: string): Promise<void> {
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    
    await axios.delete(
      `${this.baseURL}/oauth/access_token/${token}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'User-Agent': 'OwnerRez-MCP-Server/1.0'
        }
      }
    );
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const response = await this.axiosInstance.get<T>(path, { params });
    return response.data;
  }

  async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(path, data, config);
    return response.data;
  }

  async patch<T>(path: string, data?: any): Promise<T> {
    const response = await this.axiosInstance.patch<T>(path, data);
    return response.data;
  }

  async delete<T>(path: string): Promise<T> {
    const response = await this.axiosInstance.delete<T>(path);
    return response.data;
  }

  async listBookings(params: {
    property_ids?: string;
    status?: string;
    include_door_codes?: boolean;
    include_charges?: boolean;
    include_tags?: boolean;
    include_fields?: boolean;
    include_guest?: boolean;
    include_cancellation_policy?: boolean;
    include_agreements?: boolean;
    from?: string;
    to?: string;
    since_utc?: string;
  }) {
    return this.get('/v2/bookings', params);
  }

  async getBooking(id: number, params?: {
    include_door_codes?: boolean;
    include_charges?: boolean;
    include_tags?: boolean;
    include_fields?: boolean;
    include_guest?: boolean;
  }) {
    return this.get(`/v2/bookings/${id}`, params);
  }

  async createBooking(data: any) {
    return this.post('/v2/bookings', data);
  }

  async updateBooking(id: number, data: any) {
    return this.patch(`/v2/bookings/${id}`, data);
  }

  async listProperties(params?: {
    payment_method_id?: number;
    active?: boolean;
    include_tags?: boolean;
    include_fields?: boolean;
    include_listing_numbers?: boolean;
    availability_start_date?: string;
    availability_end_date?: string;
  }) {
    return this.get('/v2/properties', params);
  }

  async getProperty(id: number) {
    return this.get(`/v2/properties/${id}`);
  }

  async searchProperties(params: {
    property_ids?: string;
    guests_min?: number;
    guests_max?: number;
    pets_allowed?: boolean;
    children_allowed?: boolean;
    bedrooms_min?: number;
    bedrooms_max?: number;
    rate_min?: number;
    rate_max?: number;
    include_tag_ids?: number[];
    exclude_tag_ids?: number[];
    evaluate_rules?: boolean;
    available_from?: string;
    available_to?: string;
  }) {
    return this.get('/v2/propertysearch', params);
  }

  async listGuests(params: {
    q?: string;
    include_tags?: boolean;
    include_fields?: boolean;
    created_since_utc?: string;
    from?: string;
    to?: string;
  }) {
    return this.get('/v2/guests', params);
  }

  async getGuest(id: number) {
    return this.get(`/v2/guests/${id}`);
  }

  async createGuest(data: any) {
    return this.post('/v2/guests', data);
  }

  async updateGuest(id: number, data: any) {
    return this.patch(`/v2/guests/${id}`, data);
  }

  async deleteGuest(id: number) {
    return this.delete(`/v2/guests/${id}`);
  }

  async listQuotes(params: {
    property_ids?: string;
    include_tags?: boolean;
    include_guest?: boolean;
    since_utc?: string;
  }) {
    return this.get('/v2/quotes', params);
  }

  async getQuote(id: number) {
    return this.get(`/v2/quotes/${id}`);
  }

  async listInquiries(params: {
    property_ids?: string;
    include_tags?: boolean;
    include_guest?: boolean;
    since_utc?: string;
  }) {
    return this.get('/v2/inquiries', params);
  }

  async getInquiry(id: number) {
    return this.get(`/v2/inquiries/${id}`);
  }

  async listOwners(params?: {
    active?: boolean;
    include_tags?: boolean;
    include_fields?: boolean;
  }) {
    return this.get('/v2/owners', params);
  }

  async getOwner(id: number) {
    return this.get(`/v2/owners/${id}`);
  }

  async getCurrentUser() {
    return this.get('/v2/users/me');
  }

  async listWebhookSubscriptions() {
    return this.get('/v2/webhooksubscriptions');
  }

  async getWebhookSubscription(id: number) {
    return this.get(`/v2/webhooksubscriptions/${id}`);
  }

  async createWebhookSubscription(data: any) {
    return this.post('/v2/webhooksubscriptions', data);
  }

  async deleteWebhookSubscription(id: number) {
    return this.delete(`/v2/webhooksubscriptions/${id}`);
  }

  async getWebhookCategories() {
    return this.get('/v2/webhooksubscriptions/categories');
  }

  async listReviews(params: {
    property_id?: number;
    active?: boolean;
    host_review?: boolean;
    include_guest?: boolean;
    since_utc?: string;
  }) {
    return this.get('/v2/reviews', params);
  }

  async getReview(id: number) {
    return this.get(`/v2/reviews/${id}`);
  }

  async listListings(params?: {
    includeAmenities?: boolean;
    includeRooms?: boolean;
    includeBathrooms?: boolean;
    includeImages?: boolean;
    includeDescriptions?: boolean;
  }) {
    return this.get('/v2/listings', params);
  }

  async getListing(id: number, params?: {
    descriptionFormat?: string;
  }) {
    return this.get(`/v2/listings/${id}`, params);
  }

  async listTagDefinitions(params?: {
    active?: boolean;
  }) {
    return this.get('/v2/tagdefinitions', params);
  }

  async getTagDefinition(id: number) {
    return this.get(`/v2/tagdefinitions/${id}`);
  }

  async createTagDefinition(data: any) {
    return this.post('/v2/tagdefinitions', data);
  }

  async updateTagDefinition(id: number, data: any) {
    return this.patch(`/v2/tagdefinitions/${id}`, data);
  }

  async deleteTagDefinition(id: number) {
    return this.delete(`/v2/tagdefinitions/${id}`);
  }

  async listTags(params: {
    entity_id: number;
    entity_type: string;
  }) {
    return this.get('/v2/tags', params);
  }

  async getTag(id: number) {
    return this.get(`/v2/tags/${id}`);
  }

  async createTag(data: any) {
    return this.post('/v2/tags', data);
  }

  async deleteTag(id: number) {
    return this.delete(`/v2/tags/${id}`);
  }

  async listFieldDefinitions(params?: {
    type?: string;
    active?: boolean;
  }) {
    return this.get('/v2/fielddefinitions', params);
  }

  async getFieldDefinition(id: number) {
    return this.get(`/v2/fielddefinitions/${id}`);
  }

  async createFieldDefinition(data: any) {
    return this.post('/v2/fielddefinitions', data);
  }

  async updateFieldDefinition(id: number, data: any) {
    return this.patch(`/v2/fielddefinitions/${id}`, data);
  }

  async deleteFieldDefinition(id: number) {
    return this.delete(`/v2/fielddefinitions/${id}`);
  }

  async listFields(params: {
    entity_id: number;
    entity_type: string;
  }) {
    return this.get('/v2/fields', params);
  }

  async getField(id: number) {
    return this.get(`/v2/fields/${id}`);
  }

  async createField(data: any) {
    return this.post('/v2/fields', data);
  }

  async updateField(id: number, data: any) {
    return this.patch(`/v2/fields/${id}`, data);
  }

  async deleteField(id: number) {
    return this.delete(`/v2/fields/${id}`);
  }
}
