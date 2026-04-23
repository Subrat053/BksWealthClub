export const validateRegisterInput = (body) => {
  const errors = [];

  if (!body.fullName?.trim()) errors.push("Full name is required.");
  if (!body.email?.trim()) errors.push("Email is required.");
  if (!body.password?.trim()) errors.push("Password is required.");
  if (!body.sponsorId?.trim()) errors.push("Sponsor ID is required.");
  if (!body.registrationSource?.trim())
    errors.push("Registration source is required.");

  if (body.sponsorId && !/^BWC\d{6,}$/.test(body.sponsorId)) {
    errors.push("Sponsor ID format is invalid.");
  }

  if (body.password && body.password.length < 6) {
    errors.push("Password must be at least 6 characters.");
  }

  return errors;
};

export const validateLoginInput = (body) => {
  const errors = [];
  if (!body.identifier?.trim()) errors.push("Identifier is required.");
  if (!body.password?.trim()) errors.push("Password is required.");
  return errors;
};
