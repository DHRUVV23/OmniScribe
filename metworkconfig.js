import { HttpsProxyAgent } from 'https-proxy-agent';

export const networkSettings = {
  proxy: process.env.HTTP_PROXY 
    ? new HttpsProxyAgent(process.env.HTTP_PROXY)
    : null,
  timeout: 60000
};