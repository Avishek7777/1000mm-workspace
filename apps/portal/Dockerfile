FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration and root dependency files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy the application and package manifests 
COPY apps/portal/package.json ./apps/portal/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN pnpm install

# The rest of the files will be mounted via volumes for dev, 
# but we copy them for safety
COPY . .

EXPOSE 3001

CMD ["pnpm", "--filter", "portal", "dev"]