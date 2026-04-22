export async function apiClient(handler) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return handler();
}
