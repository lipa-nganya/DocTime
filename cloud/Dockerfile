# Dockerfile for Doc Time Backend
# Optimized for Cloud Run with cost-saving mechanisms

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY backend/ ./

# Create temp directory for PDFs
RUN mkdir -p temp

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]

