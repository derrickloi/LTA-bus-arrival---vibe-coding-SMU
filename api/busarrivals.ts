import type { Request, Response } from 'express';

const LTA_BUS_ARRIVAL_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

export interface LTANextBus {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string; // ISO 8601 string e.g. "2026-10-15T15:20:00+08:00"
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  Load: 'SEA' | 'SDA' | 'LSD' | string;
  Feature: 'WAB' | string;
  Type: 'SD' | 'DD' | 'BD' | string;
}

export interface LTABusService {
  ServiceNo: string;
  Operator: string; // e.g. "SBST", "SMRT", "TTS", "GAS"
  NextBus: LTANextBus;
  NextBus2?: LTANextBus;
  NextBus3?: LTANextBus;
}

export interface LTABusArrivalResponse {
  'odata.metadata'?: string;
  BusStopCode: string;
  Services: LTABusService[];
}

/**
 * Serverless Bus Arrivals Endpoint
 * Pulls live real-time data from LTA DataMall v3 BusArrival endpoint
 *
 * GET /api/busarrivals?BusStopCode=83139
 * GET /api/busarrivals?BusStopCode=83139&ServiceNo=15
 */
export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, x-account-key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET requests are supported.',
    });
  }

  const queryBusStopCode = (req.query.BusStopCode || req.query.busStopCode || '83139') as string;
  const queryServiceNo = (req.query.ServiceNo || req.query.serviceNo) as string | undefined;

  // Retrieve AccountKey from environment variables or custom request header (never hardcoded)
  const accountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    (req.headers['accountkey'] as string) ||
    (req.headers['x-account-key'] as string);

  if (!accountKey) {
    return res.status(200).json({
      status: 'unconfigured',
      warning: 'LTA_ACCOUNT_KEY environment variable is not set.',
      message:
        'To pull live data from LTA DataMall, set the LTA_ACCOUNT_KEY environment variable in your deployment or .env file.',
      busStopCode: queryBusStopCode,
      services: [],
      sampleEndpoint: `GET ${LTA_BUS_ARRIVAL_ENDPOINT}?BusStopCode=${queryBusStopCode}`,
      instructions: [
        '1. Register for an AccountKey at https://datamall.lta.gov.sg',
        '2. Set LTA_ACCOUNT_KEY="<YOUR_KEY>" in your environment variables',
        '3. Make a GET request to /api/busarrivals?BusStopCode=' + queryBusStopCode,
      ],
    });
  }

  try {
    const url = new URL(LTA_BUS_ARRIVAL_ENDPOINT);
    url.searchParams.set('BusStopCode', queryBusStopCode.trim());
    if (queryServiceNo && queryServiceNo.trim()) {
      url.searchParams.set('ServiceNo', queryServiceNo.trim());
    }

    const upstreamResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey.trim(),
        accept: 'application/json',
      },
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      return res.status(upstreamResponse.status).json({
        error: 'LTA_DATAMALL_UPSTREAM_ERROR',
        statusCode: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        message: 'Failed to retrieve bus arrivals from LTA DataMall.',
        details: errorText,
      });
    }

    const data: LTABusArrivalResponse = await upstreamResponse.json();

    // Cache response for 15 seconds (LTA DataMall data refreshes every ~1 min)
    res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');

    return res.status(200).json({
      status: 'success',
      source: 'LTA DataMall v3 BusArrival',
      busStopCode: data.BusStopCode || queryBusStopCode,
      servicesCount: data.Services ? data.Services.length : 0,
      services: data.Services || [],
      retrievedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(502).json({
      error: 'GATEWAY_ERROR',
      message: 'Failed to connect to LTA DataMall service.',
      details: errorMessage,
    });
  }
}
