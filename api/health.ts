import type { Request, Response } from 'express';

/**
 * Serverless Health Endpoint
 * GET /api/health
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET requests are supported.',
    });
  }

  const hasApiKey = Boolean(process.env.LTA_ACCOUNT_KEY || process.env.LTA_DATAMALL_KEY);

  return res.status(200).json({
    status: 'ok',
    service: 'lta-bus-arrival-serverless-proxy',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: hasApiKey,
    message: hasApiKey
      ? 'LTA DataMall AccountKey is configured and ready.'
      : 'LTA_ACCOUNT_KEY environment variable is not set yet. Provide it in environment settings.',
    endpoints: {
      health: '/api/health',
      busArrivals: '/api/busarrivals?BusStopCode=83139',
    },
  });
}
