import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { IServiceResponse } from '../interfaces/service-response.interface.js';

function isServiceResponse(value: unknown): value is IServiceResponse {
    return (
        typeof value === 'object' &&
        value !== null &&
        'statusCode' in value &&
        'message' in value
    );
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<IServiceResponse> {
        const response = context.switchToHttp().getResponse();

        return next.handle().pipe(
            map((result: unknown) => {
                if (isServiceResponse(result)) {
                    response.status(result.statusCode);
                    return result;
                }

                return {
                    statusCode: response.statusCode,
                    message: 'Success',
                    data: result,
                };
            }),
        );
    }
}
