FROM node:16
RUN git clone  https://github.com/Diomandeee/market.git /usr/app/market
WORKDIR /usr/app/market
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npx", "next", "start"]

