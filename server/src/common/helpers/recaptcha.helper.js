export const verifyRecaptchaToken = async (captchaToken, remoteIp) => {
  if (!captchaToken) {
    throw new Error("Captcha verification is required.");
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Captcha secret key is missing.");
  }

  const params = new URLSearchParams();
  params.append("secret", secretKey);
  params.append("response", captchaToken);

  if (remoteIp) {
    params.append("remoteip", remoteIp);
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    body: params,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error("Captcha verification failed.");
  }

  return true;
};