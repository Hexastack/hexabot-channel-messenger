/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Messenger } from '../types';

import { GraphApi, GraphRequestOptions } from './graph-api';

export class ProfileAPI {
  constructor(private readonly graphRequest: GraphApi) {
    this.graphRequest = graphRequest;
  }

  /**
   * Sets one or more properties of your bot's Messenger Profile.
   *
   * @param fields An object that contains the Messenger Profile properties to set as key-value pairs.
   * @return The API response.
   */
  public async setMessengerProfile(fields: Messenger.Profile): Promise<any> {
    if (!fields || typeof fields !== 'object') {
      throw new Error('Valid fields object required');
    }

    return await this.call(fields);
  }

  /**
   * Deletes one or more properties of your bot's Messenger Profile.
   *
   * @param fields An array list of the Messenger Profile fields to delete.
   * @return The API response.
   */
  public async deleteMessengerProfile(fields: string[]): Promise<any> {
    if (!fields || !Array.isArray(fields)) {
      throw new Error('Valid fields array required');
    }

    return this.call({ fields });
  }

  public async getUserProfile(psid: string, userFields: string) {
    return (await this.call(userFields, `/${psid}`)) as Messenger.UserData;
  }

  /**
   * Performs a call to the graph api
   *
   * @param profile An array list of the Messenger Profile fields to delete.
   * @return The API response.
   */
  public async call(
    profile: string | Messenger.Profile,
    path?: string,
  ): Promise<any> {
    const options: GraphRequestOptions = {
      path: path || '/me/messenger_profile',
    };

    if (typeof profile === 'string') {
      options.qs = { fields: profile };
    } else if (typeof profile === 'object') {
      options.payload = profile;
      if ('fields' in profile && profile.fields) {
        options.method = 'DELETE';
      }
    }

    return await this.graphRequest.sendRequest(options);
  }
}
