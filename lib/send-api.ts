/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Messenger } from '../types';

import { GraphApi } from './graph-api';

export class SendAPI {
  constructor(private readonly graphRequest: GraphApi) {}

  /**
   * Sends a sender action via the [Send API](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
   *
   * @param recipient  An object that describes the message recipient.
   * @param sender_action  The sender action to send.
   * @return The API response
   */
  public async sendSenderAction(payload: Messenger.Action): Promise<any> {
    return await this.call(payload);
  }

  /**
   * Call Graph API to either send a message or an action
   *
   * @param payload payload to be sent
   * @returns
   */
  public async call(
    payload: Messenger.OutgoingMessage | Messenger.Action,
  ): Promise<any> {
    return await this.graphRequest.sendRequest({
      path: '/me/messages',
      payload,
      //formData,
    });
  }
}

export default SendAPI;
