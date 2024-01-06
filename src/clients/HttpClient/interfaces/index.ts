import { AxiosRequestConfig } from "axios";
import { StatusCodes } from "http-status-codes";

export interface IHttpClientErrorResponse {
    code: string;
    statusCode: number;
    statusCodeAsString: keyof typeof StatusCodes;
    description: string;
}

export interface IHttpRequestResponse<T> {
    statusCode: number;
    body: T;
}

export interface IHttpClient {
    get<RESPONSE_TYPE>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<IHttpRequestResponse<RESPONSE_TYPE>>;
    post<PAYLOAD_TYPE, RESPONSE_TYPE>(
        url: string,
        data: PAYLOAD_TYPE,
        config?: AxiosRequestConfig
    ): Promise<IHttpRequestResponse<RESPONSE_TYPE>>;
    put<PAYLOAD_TYPE, RESPONSE_TYPE>(
        url: string,
        data: PAYLOAD_TYPE,
        config?: AxiosRequestConfig
    ): Promise<IHttpRequestResponse<RESPONSE_TYPE>>;
    patch<PAYLOAD_TYPE, RESPONSE_TYPE>(
        url: string,
        data: PAYLOAD_TYPE,
        config?: AxiosRequestConfig
    ): Promise<IHttpRequestResponse<RESPONSE_TYPE>>;
    delete<RESPONSE_TYPE>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<IHttpRequestResponse<RESPONSE_TYPE>>;
}