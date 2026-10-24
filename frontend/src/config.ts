/**
 * Shared frontend configuration.
 *
 * The API base URL was previously hardcoded as http://localhost:3001 in
 * several engines/components (and as a bare relative /api path in others,
 * which 404s because the CRA dev server has no proxy configured). Use this
 * one value everywhere; set REACT_APP_API_URL in the environment for any
 * non-local deployment.
 */
export const API_URL: string =
    process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const apiUrl = (path: string): string =>
    `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
