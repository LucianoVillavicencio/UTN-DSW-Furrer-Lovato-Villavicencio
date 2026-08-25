import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

/**
 * `nosniff` is the one that matters most here: uploads/ serves user-supplied
 * files from the API origin, and without it a file the browser decides to
 * treat as HTML runs as HTML.
 */
export function applySecurityHeaders(app: INestApplication): void {
  app.use(
    helmet({
      // The API serves JSON and uploaded images, never HTML that loads
      // scripts, so the default CSP would only produce noise. The frontend
      // sets its own.
      contentSecurityPolicy: false,
      frameguard: { action: 'sameorigin' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
}
