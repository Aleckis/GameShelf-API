import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

if (dsn && process.env.NODE_ENV !== 'test') {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? 'development',
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: {
        request: false,
        response: false,
      },
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      genAI: {
        inputs: false,
        outputs: false,
      },
      queues: false,
      graphQL: {
        document: false,
        variables: false,
      },
      stackFrameVariables: false,
    },

    beforeSend(event) {
      delete event.user;

      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.query_string;

        if (event.request.url) {
          event.request.url = event.request.url.split('?')[0];
        }
      }

      return event;
    },
  });
}
