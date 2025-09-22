FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create health check endpoint
RUN echo '{"status":"healthy","service":"frontend","timestamp":"'$(date -Iseconds)'"}' > /usr/share/nginx/html/health

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]