// Columns are `timestamp without time zone` filled with the database's now() (UTC).
// node-postgres parses those as local time, so without this every timestamp shifts by the
// server's UTC offset. Import this first in every entry point.
process.env.TZ = 'UTC';
