-- Set connection pool size
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';

-- Optimize for concurrent writes
ALTER SYSTEM SET synchronous_commit = 'off'; -- Faster writes
ALTER SYSTEM SET wal_writer_delay = '200ms';

-- Connection timeout
ALTER SYSTEM SET statement_timeout = '30s';
