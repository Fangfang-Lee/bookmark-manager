FROM node:20

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*

# Copy prisma first for postinstall
COPY prisma ./prisma
COPY package*.json ./
COPY package-lock.json* ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
