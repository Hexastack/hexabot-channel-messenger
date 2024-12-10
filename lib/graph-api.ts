/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import * as fs from 'fs';

import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import { lastValueFrom, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Messenger } from '../types';

import { CustomLabelsAPI } from './custom-labels-api';
import { ProfileAPI } from './profile-api';
import SendAPI from './send-api';

export interface GraphRequestOptions {
  apiVersion?: string;
  qs?: { [key: string]: any };
  path?: string;
  method?: string;
  payload?: Messenger.RequestBody;
  formData?: { [key: string]: any };
}

function formatApiVersion(version: string): string | undefined {
  if (!version) {
    return;
  }

  if (typeof version !== 'string' || version.indexOf('v') !== 0) {
    return 'v' + version;
  }
  return version;
}

export class GraphApi {
  public readonly send: SendAPI;

  public readonly profile: ProfileAPI;

  public readonly customLabels: CustomLabelsAPI;

  private graphApiVersion: string = 'v3.0';

  constructor(
    private readonly httpService: HttpService,
    private readonly pageToken: string,
  ) {
    this.send = new SendAPI(this);
    this.profile = new ProfileAPI(this);
    this.customLabels = new CustomLabelsAPI(this);
  }

  /**
   * Sets a new Graph API version to use for all requests
   *
   * @param version The new version in the format `v2.11`
   * @return Updated version number
   */
  public setApiVersion(version: string): string {
    this.graphApiVersion = formatApiVersion(version) || '';
    return this.graphApiVersion;
  }

  /**
   * Gets the current Graph API version being used for all requests
   *
   * @return Current Graph API version
   */
  public getApiVersion(): string {
    return this.graphApiVersion;
  }

  public async sendRequest(options: GraphRequestOptions): Promise<any> {
    const apiVersion = options.apiVersion || this.getApiVersion();
    const qs = options.qs || {};
    let uri = 'https://graph.facebook.com';

    if (!options.path) {
      throw new Error('Valid "path" property required');
    }

    // Default to page access token
    if (!qs.access_token) {
      const pageToken = this.pageToken;
      if (!pageToken) {
        throw new Error('Page token is not set');
      }
      qs.access_token = pageToken;
    }

    // Override default version set on GraphRequest
    if (apiVersion) {
      uri += `/${apiVersion}`;
    }

    // Set URI path
    uri += `${options.path}`;

    // Set HTTP method
    let method: string;
    if (options.method) {
      method = options.method.toUpperCase();
    } else if (options.payload || options.formData) {
      method = 'POST';
    } else {
      method = 'GET';
    }

    const axiosConfig: AxiosRequestConfig = {
      url: uri,
      method: method as any,
      params: qs,
      responseType: 'json',
    };

    // Add the request payload
    if (options.payload) {
      if (typeof options.payload !== 'object') {
        throw new Error('Invalid request payload');
      }
      axiosConfig.data = options.payload;
    }

    // Handle form data
    if (options.formData) {
      if (typeof options.formData !== 'object') {
        throw new Error('Invalid formData');
      }

      const formData = new FormData();
      for (const data in options.formData) {
        if (options.formData.hasOwnProperty(data)) {
          let value = options.formData[data];
          if (typeof value !== 'string' && !(value instanceof fs.ReadStream)) {
            value = JSON.stringify(value);
          }

          if (data === 'filedata' && typeof value === 'string') {
            value = fs.createReadStream(value);
          }

          formData.append(data, value);
        }
      }

      axiosConfig.data = formData;
      axiosConfig.headers = {
        ...axiosConfig.headers,
        ...formData.getHeaders(),
      };
    }

    return await lastValueFrom(
      this.httpService.request(axiosConfig).pipe(
        map((response) => response.data),
        catchError((error) => {
          if (error.response && error.response.data) {
            return throwError(() => error.response.data);
          }
          return throwError(() => error);
        }),
      ),
    );
  }
}
