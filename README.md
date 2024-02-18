# Multipurpose proxy server

## Description

A proxy server for Node.js based on Express.js and http-proxy-middleware with useful utils (HTML insertion, JSON and cookie manipulation in response/request).

You may find use cases in the `/src/apps/` folder:

- a dual proxy app injecting scripts in responses from a video hosting service and its CDN in order to get rid of annoying ads (including video ads blocking main content).

## Usage

Set up `.env` config (use `.env.sample` for reference).

Run the app:

```bash
npm run start
```
