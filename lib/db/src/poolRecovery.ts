import type pg from "pg";

type ConnectCallback = (...args: any[]) => void;

/**
 * Observe errors from both promise- and callback-style Pool.connect calls, as
 * well as checked-out/idle clients. The hook never retries the failed query;
 * callers can schedule a separate connection-chain recovery probe.
 */
export function watchPoolConnectionErrors(pool: pg.Pool, onError: (error: unknown) => void): void {
  const originalConnect = pool.connect.bind(pool) as (...args: any[]) => any;
  const wrappedConnect = ((callback?: ConnectCallback) => {
    if (callback) {
      return originalConnect((error: unknown, client?: pg.PoolClient, release?: (...args: any[]) => void) => {
        if (error) onError(error);
        if (client) client.on("error", onError);
        callback(error, client, release);
      });
    }

    return (originalConnect() as Promise<pg.PoolClient>).then(
      (client) => {
        client.on("error", onError);
        return client;
      },
      (error: unknown) => {
        onError(error);
        throw error;
      },
    );
  }) as typeof pool.connect;

  pool.connect = wrappedConnect;
  pool.on("error", onError);
}
