import postgres from 'postgres';

const sql = postgres({
  host: '127.0.0.1',
  port: 54329,
  user: 'neal',
  database: 'paperclip',
  password: ''
});

try {
  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  console.log('Tables:', tables.map(t => t.tablename).join(', '));
  
  const agents = await sql`SELECT id, name, adapter_type FROM agents LIMIT 5`;
  console.log('Agents:', JSON.stringify(agents, null, 2));
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await sql.end();
}
