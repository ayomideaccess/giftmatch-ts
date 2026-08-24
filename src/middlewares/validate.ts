import type { Request, Response, NextFunction } from "express";
import { success, ZodError, type Schema } from "zod";

const validate = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction) =>{
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    errors: error.issues.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message
                    }))
                })
            }
            next(error);
        }
    }
}
export default validate;