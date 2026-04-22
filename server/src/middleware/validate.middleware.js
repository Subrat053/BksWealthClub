import { ApiError } from "../core/ApiError.js";

export const validate = (schema, source = "body") => (req, _res, next) => {
  const target = req[source] || {};
  const parsed = schema.safeParse(target);

  if (!parsed.success) {
    return next(new ApiError(422, "Validation failed", parsed.error.flatten()));
  }

  req[source] = parsed.data;
  return next();
};
