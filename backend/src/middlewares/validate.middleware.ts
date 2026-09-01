import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "@/utils/apiError";

/**
 * validate() - generic request validator middleware, driven by Zod schemas.
 * Validates body/query/params against the schema BEFORE the request reaches the controller.
 * Any validator defined in validators/*.ts plugs straight into this.
 *
 * Usage: router.post("/students", validate(createStudentSchema), controller.create);
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors: Record<string, string[]> = {};
      result.error.issues.forEach((issue) => {
        // issue.path looks like ["body", "email"] - drop the "body"/"query"/"params" prefix
        const field = issue.path.slice(1).join(".") || issue.path.join(".");
        if (!errors[field]) errors[field] = [];
        errors[field].push(issue.message);
      });
      throw ApiError.badRequest("Validation failed", errors);
    }

    // Replace req values with parsed (and potentially transformed/coerced) data
    req.body = result.data.body ?? req.body;
    req.query = result.data.query ?? req.query;
    req.params = result.data.params ?? req.params;
    next();
  };
}
