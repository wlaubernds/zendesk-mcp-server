#!/usr/bin/env node

/**
 * Zendesk MCP Server
 * Provides tools for searching and reading Zendesk support tickets and knowledge base articles
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ZendeskClient, ZendeskConfig } from './zendesk-client.js';

// Get configuration from environment variables
const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL;
const ZENDESK_API_TOKEN = process.env.ZENDESK_API_TOKEN;

if (!ZENDESK_SUBDOMAIN || !ZENDESK_EMAIL || !ZENDESK_API_TOKEN) {
  console.error('Error: Missing required environment variables');
  console.error('Please set: ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN');
  process.exit(1);
}

const config: ZendeskConfig = {
  subdomain: ZENDESK_SUBDOMAIN,
  email: ZENDESK_EMAIL,
  apiToken: ZENDESK_API_TOKEN,
};

const zendeskClient = new ZendeskClient(config);

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'search_tickets',
    description: `Search Zendesk support tickets with advanced query syntax. 
    
Examples:
- "status:open tags:collections" - Find open tickets tagged with "collections"
- "subject:bug priority:high" - Find high priority bug tickets
- "tags:feature_request created>2024-01-01" - Find feature requests created after Jan 1, 2024
- "collections route" - Full-text search for "collections route"

Query syntax supports:
- status: (new, open, pending, hold, solved, closed)
- priority: (low, normal, high, urgent)
- tags: (tag names)
- created: (date comparisons like >2024-01-01, <2024-12-31)
- subject: (search in subject)
- Full text search without prefix`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query using Zendesk query syntax',
        },
        page: {
          type: 'number',
          description: 'Page number (default: 1)',
          default: 1,
        },
        per_page: {
          type: 'number',
          description: 'Results per page (default: 50, max: 100)',
          default: 50,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_ticket',
    description: 'Get full details of a specific ticket by ID, including all comments and metadata',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'number',
          description: 'The Zendesk ticket ID',
        },
        include_comments: {
          type: 'boolean',
          description: 'Whether to include all ticket comments (default: true)',
          default: true,
        },
      },
      required: ['ticket_id'],
    },
  },
  {
    name: 'search_articles',
    description: `Search Zendesk Help Center articles (knowledge base).
    
Examples:
- "collections feature" - Search for articles about collections
- "route planning guide" - Find articles about route planning
- "label:feature_name" - Search by label`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        page: {
          type: 'number',
          description: 'Page number (default: 1)',
          default: 1,
        },
        per_page: {
          type: 'number',
          description: 'Results per page (default: 50, max: 100)',
          default: 50,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_article',
    description: 'Get full content of a specific Help Center article by ID',
    inputSchema: {
      type: 'object',
      properties: {
        article_id: {
          type: 'number',
          description: 'The article ID',
        },
      },
      required: ['article_id'],
    },
  },
  {
    name: 'search_feature_feedback',
    description: `Search for all tickets and articles related to a specific feature.
    This is a convenience tool that searches for feature-related content including:
    - Bug reports
    - Feature requests
    - User feedback
    - Support questions
    
Example: "collections" will find all tickets and articles mentioning collections`,
    inputSchema: {
      type: 'object',
      properties: {
        feature_name: {
          type: 'string',
          description: 'Name of the feature to search for (e.g., "collections", "route planning")',
        },
        include_solved: {
          type: 'boolean',
          description: 'Include solved/closed tickets (default: true)',
          default: true,
        },
        days_back: {
          type: 'number',
          description: 'Number of days to look back (default: 90)',
          default: 90,
        },
      },
      required: ['feature_name'],
    },
  },
  {
    name: 'get_tickets_by_tag',
    description: 'Get all tickets with a specific tag',
    inputSchema: {
      type: 'object',
      properties: {
        tag: {
          type: 'string',
          description: 'Tag name to search for',
        },
        page: {
          type: 'number',
          description: 'Page number (default: 1)',
          default: 1,
        },
        per_page: {
          type: 'number',
          description: 'Results per page (default: 50)',
          default: 50,
        },
      },
      required: ['tag'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'zendesk-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool list requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_tickets': {
        const { query, page = 1, per_page = 50 } = args as { query: string; page?: number; per_page?: number };
        const results = await zendeskClient.searchTickets(query, page, per_page);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total_count: results.count,
                  page,
                  per_page,
                  has_more: !!results.next_page,
                  tickets: results.results.map(ticket => ({
                    id: ticket.id,
                    subject: ticket.subject,
                    description: ticket.description,
                    status: ticket.status,
                    priority: ticket.priority,
                    created_at: ticket.created_at,
                    updated_at: ticket.updated_at,
                    tags: ticket.tags,
                    channel: ticket.via?.channel,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_ticket': {
        const { ticket_id, include_comments = true } = args as { ticket_id: number; include_comments?: boolean };
        const ticket = await zendeskClient.getTicket(ticket_id);
        let comments: Array<{ id: number; body: string; author_id: number; created_at: string; public: boolean }> = [];
        
        if (include_comments) {
          comments = await zendeskClient.getTicketComments(ticket_id);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  ticket: {
                    id: ticket.id,
                    subject: ticket.subject,
                    description: ticket.description,
                    status: ticket.status,
                    priority: ticket.priority,
                    created_at: ticket.created_at,
                    updated_at: ticket.updated_at,
                    tags: ticket.tags,
                    custom_fields: ticket.custom_fields,
                  },
                  comments: comments.map(comment => ({
                    id: comment.id,
                    body: comment.body,
                    author_id: comment.author_id,
                    created_at: comment.created_at,
                    public: comment.public,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'search_articles': {
        const { query, page = 1, per_page = 50 } = args as { query: string; page?: number; per_page?: number };
        const results = await zendeskClient.searchArticles(query, page, per_page);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total_count: results.count,
                  page,
                  per_page,
                  has_more: !!results.next_page,
                  articles: results.results.map(article => ({
                    id: article.id,
                    title: article.title,
                    body: article.body,
                    url: article.html_url,
                    created_at: article.created_at,
                    updated_at: article.updated_at,
                    labels: article.label_names,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_article': {
        const { article_id } = args as { article_id: number };
        const article = await zendeskClient.getArticle(article_id);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  id: article.id,
                  title: article.title,
                  body: article.body,
                  url: article.html_url,
                  author_id: article.author_id,
                  created_at: article.created_at,
                  updated_at: article.updated_at,
                  labels: article.label_names,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'search_feature_feedback': {
        const { feature_name, include_solved = true, days_back = 90 } = args as {
          feature_name: string;
          include_solved?: boolean;
          days_back?: number;
        };

        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - days_back);
        const dateStr = dateThreshold.toISOString().split('T')[0];

        // Build query
        let ticketQuery = `${feature_name} created>${dateStr}`;
        if (!include_solved) {
          ticketQuery += ' status<solved';
        }

        // Search tickets and articles in parallel
        const [tickets, articles] = await Promise.all([
          zendeskClient.searchTickets(ticketQuery, 1, 100),
          zendeskClient.searchArticles(feature_name, 1, 50),
        ]);

        // Categorize tickets
        const categorized = {
          bug_reports: tickets.results.filter(t => 
            t.tags.some(tag => tag.toLowerCase().includes('bug')) ||
            t.subject.toLowerCase().includes('bug') ||
            t.subject.toLowerCase().includes('issue')
          ),
          feature_requests: tickets.results.filter(t =>
            t.tags.some(tag => tag.toLowerCase().includes('feature') || tag.toLowerCase().includes('enhancement')) ||
            t.subject.toLowerCase().includes('feature request') ||
            t.subject.toLowerCase().includes('enhancement')
          ),
          support_questions: tickets.results.filter(t =>
            !t.tags.some(tag => tag.toLowerCase().includes('bug') || tag.toLowerCase().includes('feature'))
          ),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  feature: feature_name,
                  search_period_days: days_back,
                  summary: {
                    total_tickets: tickets.count,
                    bug_reports: categorized.bug_reports.length,
                    feature_requests: categorized.feature_requests.length,
                    support_questions: categorized.support_questions.length,
                    related_articles: articles.count,
                  },
                  bug_reports: categorized.bug_reports.map(t => ({
                    id: t.id,
                    subject: t.subject,
                    status: t.status,
                    priority: t.priority,
                    created_at: t.created_at,
                    tags: t.tags,
                  })),
                  feature_requests: categorized.feature_requests.map(t => ({
                    id: t.id,
                    subject: t.subject,
                    status: t.status,
                    priority: t.priority,
                    created_at: t.created_at,
                    tags: t.tags,
                  })),
                  support_questions: categorized.support_questions.map(t => ({
                    id: t.id,
                    subject: t.subject,
                    status: t.status,
                    created_at: t.created_at,
                    tags: t.tags,
                  })),
                  related_articles: articles.results.map(a => ({
                    id: a.id,
                    title: a.title,
                    url: a.html_url,
                    labels: a.label_names,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_tickets_by_tag': {
        const { tag, page = 1, per_page = 50 } = args as { tag: string; page?: number; per_page?: number };
        const results = await zendeskClient.getTicketsByTag(tag, page, per_page);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  tag,
                  total_count: results.count,
                  page,
                  per_page,
                  has_more: !!results.next_page,
                  tickets: results.results.map(ticket => ({
                    id: ticket.id,
                    subject: ticket.subject,
                    status: ticket.status,
                    priority: ticket.priority,
                    created_at: ticket.created_at,
                    tags: ticket.tags,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Zendesk MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

