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
    version: "1.0.0",
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