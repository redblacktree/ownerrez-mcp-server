#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { mcpAuthMetadataRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { OwnerRezClient } from './client.js';

dotenv.config();

const client = new OwnerRezClient({
  clientId: process.env.OWNERREZ_CLIENT_ID || '',
  clientSecret: process.env.OWNERREZ_CLIENT_SECRET || '',
  redirectUri: process.env.OWNERREZ_REDIRECT_URI || '',
  accessToken: process.env.OWNERREZ_ACCESS_TOKEN || '',
});

const server = new Server(
  {
    name: 'ownerrez-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const tools: Tool[] = [
  {
    name: 'list_bookings',
    description: 'Query for a pageable list of bookings. Either property_ids or since_utc is required.',
    inputSchema: {
      type: 'object',
      properties: {
        property_ids: { type: 'string', description: 'Comma-separated property IDs' },
        status: { type: 'string', description: 'Booking status filter' },
        include_door_codes: { type: 'boolean' },
        include_charges: { type: 'boolean' },
        include_tags: { type: 'boolean' },
        include_fields: { type: 'boolean' },
        include_guest: { type: 'boolean' },
        include_cancellation_policy: { type: 'boolean' },
        include_agreements: { type: 'boolean' },
        from: { type: 'string', description: 'Date filter (YYYY-MM-DD)' },
        to: { type: 'string', description: 'Date filter (YYYY-MM-DD)' },
        since_utc: { type: 'string', description: 'UTC timestamp for changes since' },
      },
    },
  },
  {
    name: 'get_booking',
    description: 'Fetch a single booking by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Booking ID' },
        include_door_codes: { type: 'boolean' },
        include_charges: { type: 'boolean' },
        include_tags: { type: 'boolean' },
        include_fields: { type: 'boolean' },
        include_guest: { type: 'boolean' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_booking',
    description: 'Create a new booking',
    inputSchema: {
      type: 'object',
      properties: {
        property_id: { type: 'number' },
        arrival: { type: 'string' },
        departure: { type: 'string' },
        guest_id: { type: 'number' },
        data: { type: 'object', description: 'Additional booking data' },
      },
      required: ['property_id', 'arrival', 'departure'],
    },
  },
  {
    name: 'update_booking',
    description: 'Update an existing booking',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Booking ID' },
        data: { type: 'object', description: 'Fields to update' },
      },
      required: ['id', 'data'],
    },
  },
  {
    name: 'list_properties',
    description: 'Fetch all properties with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        payment_method_id: { type: 'number' },
        active: { type: 'boolean' },
        include_tags: { type: 'boolean' },
        include_fields: { type: 'boolean' },
        include_listing_numbers: { type: 'boolean' },
        availability_start_date: { type: 'string' },
        availability_end_date: { type: 'string' },
      },
    },
  },
  {
    name: 'get_property',
    description: 'Fetch a single property by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Property ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'search_properties',
    description: 'Search for properties with availability and criteria filters',
    inputSchema: {
      type: 'object',
      properties: {
        property_ids: { type: 'string', description: 'Comma-separated property IDs' },
        guests_min: { type: 'number' },
        guests_max: { type: 'number' },
        pets_allowed: { type: 'boolean' },
        children_allowed: { type: 'boolean' },
        bedrooms_min: { type: 'number' },
        bedrooms_max: { type: 'number' },
        rate_min: { type: 'number' },
        rate_max: { type: 'number' },
        include_tag_ids: { type: 'array', items: { type: 'number' } },
        exclude_tag_ids: { type: 'array', items: { type: 'number' } },
        evaluate_rules: { type: 'boolean' },
        available_from: { type: 'string' },
        available_to: { type: 'string' },
      },
    },
  },
  {
    name: 'list_guests',
    description: 'Query for a pageable list of guests. Either q or created_since_utc is required.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query' },
        include_tags: { type: 'boolean' },
        include_fields: { type: 'boolean' },
        created_since_utc: { type: 'string' },
        from: { type: 'string' },
        to: { type: 'string' },
      },
    },
  },
  {
    name: 'get_guest',
    description: 'Fetch a single guest by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Guest ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_guest',
    description: 'Create a new guest record',
    inputSchema: {
      type: 'object',
      properties: {
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        data: { type: 'object', description: 'Additional guest data' },
      },
      required: ['first_name', 'last_name'],
    },
  },
  {
    name: 'update_guest',
    description: 'Update an existing guest',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Guest ID' },
        data: { type: 'object', description: 'Fields to update' },
      },
      required: ['id', 'data'],
    },
  },
  {
    name: 'delete_guest',
    description: 'Delete a guest record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Guest ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_quotes',
    description: 'Fetch all quote records',
    inputSchema: {
      type: 'object',
      properties: {
        property_ids: { type: 'string', description: 'Comma-separated property IDs' },
        include_tags: { type: 'boolean' },
        include_guest: { type: 'boolean' },
        since_utc: { type: 'string' },
      },
    },
  },
  {
    name: 'get_quote',
    description: 'Fetch a single quote by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Quote ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_inquiries',
    description: 'Fetch all inquiry records',
    inputSchema: {
      type: 'object',
      properties: {
        property_ids: { type: 'string', description: 'Comma-separated property IDs' },
        include_tags: { type: 'boolean' },
        include_guest: { type: 'boolean' },
        since_utc: { type: 'string' },
      },
    },
  },
  {
    name: 'get_inquiry',
    description: 'Fetch a single inquiry by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Inquiry ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_owners',
    description: 'Fetch all owner records',
    inputSchema: {
      type: 'object',
      properties: {
        active: { type: 'boolean' },
        include_tags: { type: 'boolean' },
        include_fields: { type: 'boolean' },
      },
    },
  },
  {
    name: 'get_owner',
    description: 'Fetch a single owner by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Owner ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_current_user',
    description: 'Fetch the user details for the currently authenticated user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_webhook_subscriptions',
    description: 'Fetch all webhook subscriptions',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_webhook_subscription',
    description: 'Fetch a single webhook subscription by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Webhook subscription ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_webhook_subscription',
    description: 'Create a new webhook subscription',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Webhook category' },
        url: { type: 'string', description: 'Webhook URL' },
        data: { type: 'object', description: 'Additional webhook data' },
      },
      required: ['category', 'url'],
    },
  },
  {
    name: 'delete_webhook_subscription',
    description: 'Delete a webhook subscription',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Webhook subscription ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_webhook_categories',
    description: 'Fetch all available webhook categories',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_reviews',
    description: 'Get a page of reviews',
    inputSchema: {
      type: 'object',
      properties: {
        property_id: { type: 'number' },
        active: { type: 'boolean' },
        host_review: { type: 'boolean' },
        include_guest: { type: 'boolean' },
        since_utc: { type: 'string' },
      },
    },
  },
  {
    name: 'get_review',
    description: 'Fetch a single review by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Review ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_listings',
    description: 'Query for a pageable list of property listings',
    inputSchema: {
      type: 'object',
      properties: {
        includeAmenities: { type: 'boolean' },
        includeRooms: { type: 'boolean' },
        includeBathrooms: { type: 'boolean' },
        includeImages: { type: 'boolean' },
        includeDescriptions: { type: 'boolean' },
      },
    },
  },
  {
    name: 'get_listing',
    description: 'Fetch a single listing by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Listing ID' },
        descriptionFormat: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_tag_definitions',
    description: 'Fetch a pageable list of all possible tags',
    inputSchema: {
      type: 'object',
      properties: {
        active: { type: 'boolean' },
      },
    },
  },
  {
    name: 'get_tag_definition',
    description: 'Fetch a single tag definition by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Tag definition ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_tag_definition',
    description: 'Create a new tag definition',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        data: { type: 'object', description: 'Additional tag definition data' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_field_definitions',
    description: 'Fetch all possible field definitions',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        active: { type: 'boolean' },
      },
    },
  },
  {
    name: 'get_oauth_url',
    description: 'Get the OAuth authorization URL to authenticate with OwnerRez',
    inputSchema: {
      type: 'object',
      properties: {
        state: { type: 'string', description: 'Optional state parameter for OAuth flow' },
      },
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_oauth_url': {
        const url = client.getAuthorizationUrl(args?.state as string | undefined);
        return {
          content: [
            {
              type: 'text',
              text: `OAuth Authorization URL:\n\n${url}\n\nVisit this URL to authorize the application. After authorization, you'll receive an authorization code that can be exchanged for an access token.`,
            },
          ],
        };
      }

      case 'list_bookings': {
        const result = await client.listBookings(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_booking': {
        const result = await client.getBooking(args?.id as number, args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'create_booking': {
        const { property_id, arrival, departure, guest_id, data } = args as any;
        const bookingData = { property_id, arrival, departure, guest_id, ...data };
        const result = await client.createBooking(bookingData);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'update_booking': {
        const result = await client.updateBooking(args?.id as number, args?.data as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_properties': {
        const result = await client.listProperties(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_property': {
        const result = await client.getProperty(args?.id as number);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'search_properties': {
        const result = await client.searchProperties(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_guests': {
        const result = await client.listGuests(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_guest': {
        const result = await client.getGuest(args?.id as number);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'create_guest': {
        const { first_name, last_name, email, phone, data } = args as any;
        const guestData = { first_name, last_name, email, phone, ...data };
        const result = await client.createGuest(guestData);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'update_guest': {
        const result = await client.updateGuest(args?.id as number, args?.data as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'delete_guest': {
        const result = await client.deleteGuest(args?.id as number);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_quotes': {
        const result = await client.listQuotes(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_quote': {
        const result = await client.getQuote(args?.id as number);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_inquiries': {
        const result = await client.listInquiries(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_inquiry': {
        const result = await client.getInquiry(args?.id as number);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_owners': {
        const result = await client.listOwners(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_owner': {
        const result = await client.getOwner(args?.id as number);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_current_user': {
        const result = await client.getCurrentUser();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_webhook_subscriptions': {
        const result = await client.listWebhookSubscriptions();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_webhook_subscription': {
        const result = await client.getWebhookSubscription(args?.id as number);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'create_webhook_subscription': {
        const { category, url, data } = args as any;
        const webhookData = { category, url, ...data };
        const result = await client.createWebhookSubscription(webhookData);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'delete_webhook_subscription': {
        const result = await client.deleteWebhookSubscription(args?.id as number);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_webhook_categories': {
        const result = await client.getWebhookCategories();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_reviews': {
        const result = await client.listReviews(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_review': {
        const result = await client.getReview(args?.id as number);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_listings': {
        const result = await client.listListings(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_listing': {
        const result = await client.getListing(args?.id as number, args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_tag_definitions': {
        const result = await client.listTagDefinitions(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_tag_definition': {
        const result = await client.getTagDefinition(args?.id as number);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'create_tag_definition': {
        const { name, data } = args as any;
        const tagData = { name, ...data };
        const result = await client.createTagDefinition(tagData);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'list_field_definitions': {
        const result = await client.listFieldDefinitions(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}\n${error.response?.data ? JSON.stringify(error.response.data, null, 2) : ''}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transportMode = process.env.TRANSPORT_MODE || 'stdio';
  
  if (transportMode === 'http') {
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;
    const ownerrezOAuthMetadata = {
      issuer: 'https://api.ownerrez.com',
      authorization_endpoint: 'https://app.ownerrez.com/oauth/authorize',
      token_endpoint: 'https://api.ownerrez.com/oauth/access_token',
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      code_challenge_methods_supported: ['S256'],
      revocation_endpoint: 'https://api.ownerrez.com/oauth/access_token/{token}',
      service_documentation: 'https://api.ownerrez.com/help/oauth'
    };
    
    app.use(mcpAuthMetadataRouter({
      oauthMetadata: ownerrezOAuthMetadata,
      resourceServerUrl: new URL(serverUrl),
      resourceName: 'OwnerRez MCP Server',
      serviceDocumentationUrl: new URL('https://github.com/redblacktree/ownerrez-mcp-server')
    }));
    
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok' });
    });
    
    app.post('/sse', async (req, res) => {
      const transport = new SSEServerTransport('/message', res);
      await server.connect(transport);
      console.error('Client connected via SSE');
    });
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.error(`OwnerRez MCP Server running on HTTP port ${port}`);
      console.error(`OAuth metadata available at: ${serverUrl}/.well-known/oauth-authorization-server`);
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('OwnerRez MCP Server running on stdio');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
