FROM oven/bun:1.2-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "src/index.ts"]