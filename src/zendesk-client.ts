/**
 * Zendesk API Client
 * Handles authentication and API requests to Zendesk
 */

import fetch from 'node-fetch';

export interface ZendeskConfig {
  subdomain: string;
  email: string;
  apiToken: string;
}

export interface ZendeskTicket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  custom_fields?: Array<{ id: number; value: any }>;
  via?: {
    channel: string;
  };
}

export interface ZendeskArticle {
  id: number;
  title: string;
  body: string;
  author_id: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  section_id: number;
  label_names?: string[];
}

export interface SearchResult<T> {
  results: T[];
  count: number;
  next_page: string | null;
  previous_page: string | null;
}

export class ZendeskClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(private config: ZendeskConfig) {
    this.baseUrl = `https://${config.subdomain}.zendesk.com/api/v2`;
    // Base64 encode email/token for basic auth
    const credentials = Buffer.from(`${config.email}/token:${config.apiToken}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zendesk API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Search tickets by query string
   * Query examples:
   * - "type:ticket status:open tags:collections"
   * - "type:ticket created>2024-01-01"
   * - "type:ticket subject:bug priority:high"
   */
  async searchTickets(query: string, page = 1, perPage = 50): Promise<SearchResult<ZendeskTicket>> {
    const params: Record<string, string> = {
      query: `type:ticket ${query}`,
      per_page: perPage.toString(),
      page: page.toString(),
    };

    const response = await this.request<{ results: ZendeskTicket[]; count: number; next_page: string | null; previous_page: string | null }>(
      '/search.json',
      params
    );

    return response;
  }

  /**
   * Get a specific ticket by ID
   */
  async getTicket(ticketId: number): Promise<ZendeskTicket> {
    const response = await this.request<{ ticket: ZendeskTicket }>(`/tickets/${ticketId}.json`);
    return response.ticket;
  }

  /**
   * Search articles in Help Center
   * Query examples:
   * - "collections route planning"
   * - "label:feature_name"
   */
  async searchArticles(query: string, page = 1, perPage = 50): Promise<SearchResult<ZendeskArticle>> {
    const params: Record<string, string> = {
      query,
      per_page: perPage.toString(),
      page: page.toString(),
    };

    const response = await this.request<{ results: ZendeskArticle[]; count: number; next_page: string | null; previous_page: string | null }>(
      '/help_center/articles/search.json',
      params
    );

    return response;
  }

  /**
   * Get a specific article by ID
   */
  async getArticle(articleId: number): Promise<ZendeskArticle> {
    const response = await this.request<{ article: ZendeskArticle }>(`/help_center/articles/${articleId}.json`);
    return response.article;
  }

  /**
   * Get comments for a ticket
   */
  async getTicketComments(ticketId: number): Promise<Array<{ id: number; body: string; author_id: number; created_at: string; public: boolean }>> {
    const response = await this.request<{ comments: Array<{ id: number; body: string; author_id: number; created_at: string; public: boolean }> }>(
      `/tickets/${ticketId}/comments.json`
    );
    return response.comments;
  }

  /**
   * Advanced search across both tickets and articles
   * Useful for finding all content related to a specific feature
   */
  async searchAll(query: string, page = 1, perPage = 50): Promise<SearchResult<ZendeskTicket | ZendeskArticle>> {
    const params: Record<string, string> = {
      query,
      per_page: perPage.toString(),
      page: page.toString(),
    };

    const response = await this.request<{ results: Array<ZendeskTicket | ZendeskArticle>; count: number; next_page: string | null; previous_page: string | null }>(
      '/search.json',
      params
    );

    return response;
  }

  /**
   * Get tickets with specific tags
   */
  async getTicketsByTag(tag: string, page = 1, perPage = 50): Promise<SearchResult<ZendeskTicket>> {
    return this.searchTickets(`tags:${tag}`, page, perPage);
  }

  /**
   * Get recent tickets (last 30 days)
   */
  async getRecentTickets(page = 1, perPage = 50): Promise<SearchResult<ZendeskTicket>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    return this.searchTickets(`created>${dateStr}`, page, perPage);
  }
}


