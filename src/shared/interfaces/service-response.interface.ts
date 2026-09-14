export interface IServiceResponse<T = unknown> {
    statusCode: number;
    message: string;
    data?: T;
}
