import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    userId?: number;
    userRole?: string;
    clientId?: number;
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=auth.d.ts.map