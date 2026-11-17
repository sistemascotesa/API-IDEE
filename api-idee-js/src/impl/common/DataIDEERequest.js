import { isNullOrEmpty } from 'IDEE/util/Utils';
import { get as getRemote } from 'IDEE/util/Remote';
import { getValue } from 'IDEE/i18n/language';
import { RequestCancelledError } from './RequestManager';
import exceptionMessage from './exceptionMessage';

/** True when the service rejected the request credentials (HTTP 401/403). */
export function isUnauthorizedError(error) {
  return error?.status === 401 || error?.status === 403;
}

function validateGeoJSON(response) {
  if (!response || !Number.isInteger(response.code) || response.code < 200
    || response.code >= 300 || typeof response.text !== 'string') {
    const error = new Error(response
      ? exceptionMessage('dataidee_request_failed_http', { status: response.code })
      : exceptionMessage('dataidee_request_failed'));
    error.status = response?.code;
    throw error;
  }
  if (isNullOrEmpty(response.text)) throw new Error(getValue('exception').no_service_response);
  let geoJSON;
  try {
    geoJSON = JSON.parse(response.text);
  } catch (error) {
    throw new Error(exceptionMessage('dataidee_invalid_geojson'));
  }
  const isFeature = geoJSON?.type === 'Feature' && geoJSON.geometry !== undefined;
  const isCollection = geoJSON?.type === 'FeatureCollection'
    && Array.isArray(geoJSON.features)
    && geoJSON.features.every((feature) => feature?.type === 'Feature');
  if (!isFeature && !isCollection) throw new Error(exceptionMessage('dataidee_invalid_geojson'));
}

/**
 * Prepare a DataIDEE GET operation. Authentication and projection remain in each loader.
 * The request is identified by its exact URL/context. A forced execution only bypasses the
 * RequestManager cache and requests the same URL: DataIDEE rejects unknown query
 * parameters (HTTP 400), so no cache-busting parameter is added, and its responses are
 * not stored by the browser (Cache-Control: no-store).
 * Validation (including asynchronous consumer validation) completes before caching text.
 * decorateUrl adds per-request parameters (contextToken) at execution time, outside the key.
 */
export default function createDataIDEERequest({
  url, context, requestOptions, force = false, validateResponse, shouldExecute = () => true,
  decorateUrl = (target) => target,
}) {
  return {
    key: JSON.stringify(['GET', url, context]),
    force,
    execute: async () => {
      if (!shouldExecute()) throw new RequestCancelledError('obsolete viewport');
      const requestUrl = await decorateUrl(url);
      if (!shouldExecute()) throw new RequestCancelledError('obsolete viewport');
      const response = await getRemote(requestUrl, null, requestOptions);
      validateGeoJSON(response);
      await validateResponse?.(response.text);
      const cacheControl = Object.entries(response.headers || {})
        .filter(([name]) => name.toLowerCase() === 'cache-control')
        .map(([, value]) => value).join(',');
      return {
        value: response.text,
        cacheable: !/\b(?:no-store|no-cache)\b/i.test(cacheControl),
        bytes: response.text.length * 2,
      };
    },
  };
}
