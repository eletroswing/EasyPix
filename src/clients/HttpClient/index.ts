import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, CreateAxiosDefaults } from 'axios';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

import { HttpClientError } from './errors';
import { IHttpClient, IHttpRequestResponse } from './interfaces';

export class AxiosHttpClient implements IHttpClient {
    private readonly fetcher: AxiosInstance;

    constructor(
        config: CreateAxiosDefaults = {
            timeout: 2 * 60 * 1000, // 2 minutes
            headers: {
                accept: 'application/json',
                'content-type': 'application/json'
            }
        }
    ) {
        this.fetcher = axios.create(config)
    }

    private handleResponseError(
        error: AxiosError,
    ): void {
        const { isAxiosError = false, response } =
            error as AxiosError;
        if (isAxiosError) {
            throw new HttpClientError(
                `error calling ${response?.config.url}`,
                response?.data || {},
                getReasonPhrase(response?.status || '') as keyof typeof StatusCodes || 'REQUEST_TIMEOUT'
            );
        }
    }

    async put<T, D>(
        url: string,
        data: D,
        config?: AxiosRequestConfig
    ): Promise<IHttpRequestResponse<T>> {
        try {
            const result = await this.fetcher.put<T>(url, data, config);
            return { statusCode: result.status, body: result.data };
        } catch (error) {
            this.handleResponseError(error as AxiosError);
            throw error;
        }
    }

    async patch<T, D>(
        url: string,
        data: D,
        config?: AxiosRequestConfig
    ): Promise<IHttpRequestResponse<T>> {
        try {
            const result = await this.fetcher.patch<T>(url, data, config);
            return { statusCode: result.status, body: result.data };
        } catch (error) {
            this.handleResponseError(error as AxiosError);
            throw error;
        }
    }

    async delete<T>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<IHttpRequestResponse<T>> {
        try {
            const result = await this.fetcher.delete<T>(url, config);
            return { statusCode: result.status, body: result.data };
        } catch (error) {
            this.handleResponseError(error as AxiosError);
            throw error;
        }
    }

    async get<T>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<IHttpRequestResponse<T>> {
        try {
            const result = await this.fetcher.get<T>(url, config);
            return { statusCode: result.status, body: result.data };
        } catch (error) {
            this.handleResponseError(error as AxiosError);
            throw error;
        }
    }

    async post<T, D>(
        url: string,
        data: D,
        config?: AxiosRequestConfig
    ): Promise<IHttpRequestResponse<T>> {
        try {
            const result = await this.fetcher.post<T>(url, data, config);
            return { statusCode: result.status, body: result.data };
        } catch (error) {
            this.handleResponseError(error as AxiosError);
            throw error;
        }
    }
}

export default new AxiosHttpClient();
