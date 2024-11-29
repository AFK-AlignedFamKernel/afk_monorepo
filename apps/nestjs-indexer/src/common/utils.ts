export function getEnvPath() {
  const env: string | undefined = process.env.NODE_ENV;
  const envPath = `${process.cwd()}/.env${env ? '.' + env : '.local'}`;

  return envPath;
}
