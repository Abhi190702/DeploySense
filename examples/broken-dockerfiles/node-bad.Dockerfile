FROM node:latest
ENV API_KEY=super-secret
COPY . .
RUN npm install
RUN npm run build
RUN npm prune --production
CMD ["npm", "start"]
