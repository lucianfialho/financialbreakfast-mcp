#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || "https://financialbreakfast-production.up.railway.app";
const API_KEY = process.env.API_KEY || "demo-key-12345";

const server = new Server(
  {
    name: "financial-data-mcp",
    version: "2.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Helper function to make API requests
async function makeAPIRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch from ${url}: ${error.message}`);
  }
}

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  return {
    tools: [
      {
        name: "get_companies",
        description: "Get list of available companies (PETR4, VALE3)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_company_details",
        description: "Get detailed information about a specific company",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Company symbol (PETR4 or VALE3)",
              enum: ["PETR4", "VALE3"],
            },
          },
          required: ["symbol"],
        },
      },
      {
        name: "get_financial_data",
        description: "Get comprehensive financial data for a company with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Company symbol (PETR4 or VALE3)",
              enum: ["PETR4", "VALE3"],
            },
            years: {
              type: "string",
              description: "Comma-separated years to filter (e.g., '2024,2025')",
            },
            metrics: {
              type: "string",
              description: "Comma-separated metrics to filter (e.g., 'net_revenue,ebitda')",
            },
            limit: {
              type: "number",
              description: "Maximum number of periods to return (1-100)",
              minimum: 1,
              maximum: 100,
            },
          },
          required: ["symbol"],
        },
      },
      {
        name: "get_available_metrics",
        description: "Get list of available financial metrics for a company",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Company symbol (PETR4 or VALE3)",
              enum: ["PETR4", "VALE3"],
            },
          },
          required: ["symbol"],
        },
      },
      {
        name: "get_metric_time_series",
        description: "Get time series data for a specific metric. Note: Not all metrics are available for all companies. Use get_available_metrics first to check.",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Company symbol (PETR4 or VALE3)",
              enum: ["PETR4", "VALE3"],
            },
            metric_name: {
              type: "string",
              description: "Metric name - availability varies by company. PETR4: ebitda, net_debt. VALE3: ebitda only.",
              enum: ["net_revenue", "ebitda", "net_income", "capex", "net_debt"],
            },
          },
          required: ["symbol", "metric_name"],
        },
      },
      {
        name: "semantic_search",
        description: "Search earnings call transcriptions using semantic search. Find relevant segments by topic, concept, or keyword.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (topic, concept, or keyword in Portuguese or English)",
            },
            company: {
              type: "string",
              description: "Optional: Filter by company symbol (PETR4 or VALE3)",
              enum: ["PETR4", "VALE3"],
            },
            limit: {
              type: "number",
              description: "Maximum number of results (1-20, default: 10)",
              minimum: 1,
              maximum: 20,
            },
            threshold: {
              type: "number",
              description: "Similarity threshold 0-1 (default: 0.5)",
              minimum: 0.1,
              maximum: 1.0,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "search_by_topic",
        description: "Search earnings call segments by specific topic or keyword",
        inputSchema: {
          type: "object",
          properties: {
            topic: {
              type: "string",
              description: "Topic or keyword to search for",
            },
            company: {
              type: "string",
              description: "Optional: Filter by company symbol",
              enum: ["PETR4", "VALE3"],
            },
            year: {
              type: "number",
              description: "Optional: Filter by year",
              minimum: 2020,
              maximum: 2030,
            },
            limit: {
              type: "number",
              description: "Maximum number of results (1-30, default: 20)",
              minimum: 1,
              maximum: 30,
            },
          },
          required: ["topic"],
        },
      },
      {
        name: "get_sentiment_timeline",
        description: "Get sentiment analysis timeline for a company across different earnings calls",
        inputSchema: {
          type: "object",
          properties: {
            company: {
              type: "string",
              description: "Company symbol (PETR4 or VALE3)",
              enum: ["PETR4", "VALE3"],
            },
            start_year: {
              type: "number",
              description: "Optional: Start year for timeline",
              minimum: 2020,
              maximum: 2030,
            },
            end_year: {
              type: "number",
              description: "Optional: End year for timeline",
              minimum: 2020,
              maximum: 2030,
            },
          },
          required: ["company"],
        },
      },
      {
        name: "get_call_highlights",
        description: "Get highlights and key insights from a specific earnings call",
        inputSchema: {
          type: "object",
          properties: {
            company: {
              type: "string",
              description: "Company symbol (PETR4 or VALE3)",
              enum: ["PETR4", "VALE3"],
            },
            year: {
              type: "number",
              description: "Year of the earnings call",
              minimum: 2020,
              maximum: 2030,
            },
            quarter: {
              type: "number",
              description: "Quarter (1-4)",
              minimum: 1,
              maximum: 4,
            },
          },
          required: ["company", "year", "quarter"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_companies":
        const companies = await makeAPIRequest("/api/v1/companies");
        return {
          content: [
            {
              type: "text",
              text: `Available Companies:\n\n${companies
                .map(
                  (company) =>
                    `• ${company.symbol}: ${company.name}\n  Sector: ${company.sector}\n  Country: ${company.country}\n  Currency: ${company.currency}`
                )
                .join("\n\n")}`,
            },
          ],
        };

      case "get_company_details":
        const companyDetails = await makeAPIRequest(`/api/v1/companies/${args.symbol}`);
        return {
          content: [
            {
              type: "text",
              text: `Company Details for ${companyDetails.symbol}:

Name: ${companyDetails.name}
Sector: ${companyDetails.sector}
Country: ${companyDetails.country}
Currency: ${companyDetails.currency}`,
            },
          ],
        };

      case "get_financial_data":
        let endpoint = `/api/v1/financial-data/${args.symbol}`;
        const queryParams = new URLSearchParams();

        if (args.years) queryParams.append("years", args.years);
        if (args.metrics) queryParams.append("metrics", args.metrics);
        if (args.limit) queryParams.append("limit", args.limit.toString());

        if (queryParams.toString()) {
          endpoint += `?${queryParams.toString()}`;
        }

        const financialData = await makeAPIRequest(endpoint);

        let response = `Financial Data for ${financialData.company_name} (${financialData.company_symbol})\n`;
        response += `Total Periods: ${financialData.total_periods}\n\n`;

        if (financialData.applied_filters && Object.keys(financialData.applied_filters).length > 0) {
          response += `Applied Filters:\n`;
          Object.entries(financialData.applied_filters).forEach(([key, value]) => {
            if (value) response += `• ${key}: ${value}\n`;
          });
          response += "\n";
        }

        financialData.periods.forEach((period) => {
          response += `${period.period_label} (${period.year} Q${period.quarter}):\n`;
          period.financial_data.forEach((metric) => {
            const value = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: metric.currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(metric.value * 1000000); // Convert millions to actual value

            response += `  • ${metric.metric_label}: ${value} ${metric.unit}\n`;
          });
          response += "\n";
        });

        return {
          content: [
            {
              type: "text",
              text: response,
            },
          ],
        };

      case "get_available_metrics":
        const metrics = await makeAPIRequest(`/api/v1/financial-data/${args.symbol}/metrics`);
        return {
          content: [
            {
              type: "text",
              text: `Available Metrics for ${args.symbol}:\n\n${metrics
                .map((metric) => `• ${metric}`)
                .join("\n")}`,
            },
          ],
        };

      case "get_metric_time_series":
        // First check if the metric is available for this company
        const availableMetrics = await makeAPIRequest(`/api/v1/financial-data/${args.symbol}/metrics`);

        if (!availableMetrics.includes(args.metric_name)) {
          return {
            content: [
              {
                type: "text",
                text: `Metric "${args.metric_name}" is not available for ${args.symbol}.\n\nAvailable metrics: ${availableMetrics.join(", ")}`,
              },
            ],
          };
        }

        const timeSeries = await makeAPIRequest(
          `/api/v1/financial-data/${args.symbol}/metric/${args.metric_name}`
        );

        let timeSeriesResponse = `Time Series for ${args.metric_name.toUpperCase()} - ${args.symbol}\n`;
        timeSeriesResponse += `Metric: ${timeSeries[0]?.metric_label}\n\n`;

        timeSeries.forEach((point) => {
          const value = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: point.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(point.value * 1000000); // Convert millions to actual value

          timeSeriesResponse += `${point.period} (${point.year} Q${point.quarter}): ${value} ${point.unit}\n`;
        });

        return {
          content: [
            {
              type: "text",
              text: timeSeriesResponse,
            },
          ],
        };

      case "semantic_search":
        let searchEndpoint = `/api/v1/earnings-calls/search`;
        const searchParams = new URLSearchParams();

        searchParams.append("query", args.query);
        if (args.company) searchParams.append("company", args.company);
        if (args.limit) searchParams.append("limit", args.limit.toString());
        if (args.threshold) searchParams.append("threshold", args.threshold.toString());

        searchEndpoint += `?${searchParams.toString()}`;

        const searchResults = await makeAPIRequest(searchEndpoint);

        let searchResponse = `Semantic Search Results for "${args.query}"\n`;
        searchResponse += `Total Results: ${searchResults.total_results}\n`;

        if (args.company) searchResponse += `Filtered by: ${args.company}\n`;
        searchResponse += `\n`;

        searchResults.results.forEach((result, index) => {
          searchResponse += `${index + 1}. [${result.company} - ${result.period}]\n`;
          searchResponse += `   Similarity: ${result.similarity_score}\n`;
          searchResponse += `   Sentiment: ${result.sentiment?.label || 'N/A'} (${result.sentiment?.score || 'N/A'})\n`;
          searchResponse += `   Keywords: ${result.keywords?.join(', ') || 'N/A'}\n`;
          searchResponse += `   Text: ${result.text.substring(0, 200)}...\n`;
          if (result.timestamp) {
            searchResponse += `   Timestamp: ${Math.floor(result.timestamp.start/60)}:${Math.floor(result.timestamp.start%60).toString().padStart(2, '0')}\n`;
          }
          searchResponse += `\n`;
        });

        return {
          content: [
            {
              type: "text",
              text: searchResponse,
            },
          ],
        };

      case "search_by_topic":
        let topicEndpoint = `/api/v1/earnings-calls/search-topic`;
        const topicParams = new URLSearchParams();

        topicParams.append("topic", args.topic);
        if (args.company) topicParams.append("company", args.company);
        if (args.year) topicParams.append("year", args.year.toString());
        if (args.limit) topicParams.append("limit", args.limit.toString());

        topicEndpoint += `?${topicParams.toString()}`;

        const topicResults = await makeAPIRequest(topicEndpoint);

        let topicResponse = `Topic Search Results for "${args.topic}"\n`;
        topicResponse += `Total Results: ${topicResults.total_results}\n`;

        if (args.company) topicResponse += `Company Filter: ${args.company}\n`;
        if (args.year) topicResponse += `Year Filter: ${args.year}\n`;
        topicResponse += `\n`;

        topicResults.results.forEach((result, index) => {
          topicResponse += `${index + 1}. [${result.company} - ${result.period}]\n`;
          topicResponse += `   Relevance: ${result.relevance_score || result.similarity_score}\n`;
          topicResponse += `   Sentiment: ${result.sentiment?.label || 'N/A'}\n`;
          topicResponse += `   Keywords: ${result.keywords?.join(', ') || 'N/A'}\n`;
          topicResponse += `   Text: ${result.text.substring(0, 200)}...\n\n`;
        });

        return {
          content: [
            {
              type: "text",
              text: topicResponse,
            },
          ],
        };

      case "get_sentiment_timeline":
        let timelineEndpoint = `/api/v1/earnings-calls/${args.company}/sentiment-timeline`;
        const timelineParams = new URLSearchParams();

        if (args.start_year) timelineParams.append("start_year", args.start_year.toString());
        if (args.end_year) timelineParams.append("end_year", args.end_year.toString());

        if (timelineParams.toString()) {
          timelineEndpoint += `?${timelineParams.toString()}`;
        }

        const timeline = await makeAPIRequest(timelineEndpoint);

        let timelineResponse = `Sentiment Timeline for ${timeline.company}\n`;
        timelineResponse += `Total Periods: ${timeline.total_periods}\n\n`;

        timeline.timeline.forEach((period) => {
          timelineResponse += `${period.period} (${period.year} Q${period.quarter}):\n`;
          timelineResponse += `  Average Sentiment: ${period.sentiment?.average || 'N/A'}\n`;
          timelineResponse += `  Overall Sentiment: ${period.sentiment?.overall || 'N/A'}\n`;
          timelineResponse += `  Segments Analyzed: ${period.segment_count}\n`;
          timelineResponse += `  Risk Mentions: ${period.risk_mentions}\n`;
          timelineResponse += `  Opportunity Mentions: ${period.opportunity_mentions}\n`;
          if (period.key_topics && period.key_topics.length > 0) {
            timelineResponse += `  Key Topics: ${period.key_topics.join(', ')}\n`;
          }
          timelineResponse += `\n`;
        });

        return {
          content: [
            {
              type: "text",
              text: timelineResponse,
            },
          ],
        };

      case "get_call_highlights":
        const highlightsEndpoint = `/api/v1/earnings-calls/${args.company}/${args.year}Q${args.quarter}/highlights`;

        const highlights = await makeAPIRequest(highlightsEndpoint);

        if (highlights.error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${highlights.error}`,
              },
            ],
            isError: true,
          };
        }

        let highlightsResponse = `Call Highlights for ${highlights.company} - ${highlights.period}\n`;
        highlightsResponse += `Overall Sentiment: ${highlights.overall_sentiment || 'N/A'}\n`;
        highlightsResponse += `Risk Mentions: ${highlights.risk_mentions}\n`;
        highlightsResponse += `Opportunity Mentions: ${highlights.opportunity_mentions}\n\n`;

        if (highlights.key_topics && highlights.key_topics.length > 0) {
          highlightsResponse += `Key Topics: ${highlights.key_topics.join(', ')}\n\n`;
        }

        if (highlights.summary) {
          highlightsResponse += `Summary:\n${highlights.summary}\n\n`;
        }

        if (highlights.positive_highlights && highlights.positive_highlights.length > 0) {
          highlightsResponse += `Most Positive Moments:\n`;
          highlights.positive_highlights.forEach((highlight, index) => {
            highlightsResponse += `${index + 1}. Sentiment: ${highlight.sentiment_score}\n`;
            highlightsResponse += `   Text: ${highlight.text}\n`;
            if (highlight.keywords && highlight.keywords.length > 0) {
              highlightsResponse += `   Keywords: ${highlight.keywords.join(', ')}\n`;
            }
            highlightsResponse += `\n`;
          });
        }

        if (highlights.negative_highlights && highlights.negative_highlights.length > 0) {
          highlightsResponse += `Most Negative Moments:\n`;
          highlights.negative_highlights.forEach((highlight, index) => {
            highlightsResponse += `${index + 1}. Sentiment: ${highlight.sentiment_score}\n`;
            highlightsResponse += `   Text: ${highlight.text}\n`;
            if (highlight.keywords && highlight.keywords.length > 0) {
              highlightsResponse += `   Keywords: ${highlight.keywords.join(', ')}\n`;
            }
            highlightsResponse += `\n`;
          });
        }

        return {
          content: [
            {
              type: "text",
              text: highlightsResponse,
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);

console.error("Financial Data MCP server running...");