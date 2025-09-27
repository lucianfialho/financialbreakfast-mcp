# Release Notes - v2.0.0

## 🚀 Major Release: Complete Historical Financial Data

### 📊 **What's New**

- **22 Periods of Historical Data** (2020-2025) for PETR4 and VALE3
- **110 Financial Metrics** extracted from official quarterly reports
- **Production API** running on Railway at `https://financialbreakfast-production.up.railway.app`
- **Enhanced MCP Tools** with improved validation and error handling

### 📈 **Data Coverage**

**Companies:**
- **PETR4** - Petróleo Brasileiro S.A. (Petrobras)
- **VALE3** - Vale S.A.

**Metrics:**
- Revenue (Receita Líquida)
- EBITDA
- Net Income (Lucro Líquido)
- Net Debt (Dívida Líquida)
- CAPEX (Investimentos)

**Timeline:**
- Complete quarterly data from 1T2020 to 2T2025
- Real data extracted from official company reports

### 🛠️ **Technical Improvements**

- Updated to **MCP SDK v1.12.1**
- Production-ready API deployment on Railway
- Enhanced error handling and data validation
- Optimized performance for large datasets
- Comprehensive documentation and examples

### 📦 **Installation**

**One-Click Download:**
```bash
curl -L https://github.com/lucianfialho/financial-mcp-dxt/releases/download/v2.0.0/financial-data-mcp.dxt -o financial-data-mcp.dxt
```

**Manual:**
1. Download `financial-data-mcp.dxt` from this release
2. Open Claude Desktop → Settings → Developer → MCP Bundles
3. Click "Install Bundle" and select the DXT file

### 🔧 **Configuration**

Default configuration works out of the box:
- **API URL:** `https://financialbreakfast-production.up.railway.app`
- **API Key:** `demo-key-12345` (free tier)

### 📋 **Example Usage**

```javascript
// Get latest Petrobras financial data
get_financial_data({ symbol: "PETR4", limit: 4 })

// Get EBITDA time series
get_metric_time_series({ symbol: "PETR4", metric_name: "ebitda" })

// Filter by years and metrics
get_financial_data({
  symbol: "PETR4",
  years: "2022,2023",
  metrics: "net_revenue,ebitda"
})
```

### 🔗 **URLs**

- **API Docs:** https://financialbreakfast-production.up.railway.app/api/docs
- **Health Check:** https://financialbreakfast-production.up.railway.app/api/health
- **Repository:** https://github.com/lucianfialho/financial-mcp-dxt

### 🎯 **Breaking Changes**

- Updated API URLs to production Railway deployment
- Enhanced data structure with additional metadata
- Improved error responses and validation

---

**Full Changelog:** https://github.com/lucianfialho/financial-mcp-dxt/compare/v1.0.0...v2.0.0

🚀 **Generated with [Claude Code](https://claude.ai/code)**