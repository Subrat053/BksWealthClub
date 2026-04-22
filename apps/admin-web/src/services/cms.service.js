const wait = () => new Promise((resolve) => setTimeout(resolve, 150));

export const cmsService = {
  getPages: async () => {
    await wait();
    return [];
  },
  saveBanner: async (payload) => {
    await wait();
    return { ok: true, payload };
  },
};
