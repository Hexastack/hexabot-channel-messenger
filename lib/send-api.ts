import { GraphApi } from './graph-api';
import { Messenger } from '../types';

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
