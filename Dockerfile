FROM cypress/base:20.9.0

WORKDIR /e2e

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Run pretest scripts and tests
CMD ["npm", "run", "test"]
