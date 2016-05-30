FROM node:latest

RUN apt-get update && \
    apt-get install graphicsmagick