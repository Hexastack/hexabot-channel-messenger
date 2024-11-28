/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import EventWrapper from '@/channel/lib/EventWrapper';
import {
  AttachmentForeignKey,
  AttachmentPayload,
  FileType,
} from '@/chat/schemas/types/attachment';
import {
  IncomingMessageType,
  PayloadType,
  StdEventType,
  StdIncomingMessage,
} from '@/chat/schemas/types/message';
import { Payload } from '@/chat/schemas/types/quick-reply';

import MessengerHandler from './index.channel';
import { Messenger } from './types';

type MessengerEventAdapter =
  | {
      eventType: StdEventType.unknown;
      messageType: never;
      raw: Messenger.Event;
    }
  | {
      eventType: StdEventType.read;
      messageType: never;
      raw: Messenger.MessageReadEvent;
    }
  | {
      eventType: StdEventType.delivery;
      messageType: never;
      raw: Messenger.MessageDeliveryEvent;
    }
  | {
      eventType: StdEventType.message;
      messageType: IncomingMessageType.postback;
      raw: Messenger.IncomingMessage<Messenger.IncomingPostback>;
    }
  | {
      eventType: StdEventType.message | StdEventType.echo;
      messageType: IncomingMessageType.message;
      raw: Messenger.IncomingMessage<
        Messenger.IncomingAnyMessage<Messenger.IncomingTextMessage>
      >;
    }
  | {
      eventType: StdEventType.message;
      messageType: IncomingMessageType.quick_reply;
      raw: Messenger.IncomingMessage<
        Messenger.IncomingAnyMessage<Messenger.IncomingQuickReplyMessage>
      >;
    }
  | {
      eventType: StdEventType.message | StdEventType.echo;
      messageType:
        | IncomingMessageType.location
        | IncomingMessageType.attachments;
      raw: Messenger.IncomingMessage<
        Messenger.IncomingAnyMessage<Messenger.IncomingAttachmentMessage>
      >;
    }
  | {
      eventType: StdEventType.message | StdEventType.echo;
      messageType: IncomingMessageType.unknown;
      raw: Messenger.IncomingMessage;
    };

export default class MessengerEventWrapper extends EventWrapper<
  MessengerEventAdapter,
  Messenger.Event
> {
  /**
   * Constructor : channel's event wrapper
   *
   * @param handler - The channel's handler
   * @param event - The message event received
   */
  constructor(handler: MessengerHandler, event: Messenger.Event) {
    super(handler, event);
  }

  /**
   * Called by the parent constructor, it defines :
   *     - The type of event received
   *     - The type of message when the event is a message.
   *     - Sets a typed raw object of the event data
   *
   * @param event - The message event received
   */
  _init(event: Messenger.Event) {
    if ('message' in event) {
      if ('is_echo' in event.message) {
        // If needed, you can subscribe to this callback by selecting
        // the message_echoes field when setting up your webhook.
        // It could be useful to sync messages sent directly
        // from the page itself
        this._adapter.eventType = StdEventType.echo;
      } else {
        this._adapter.eventType = StdEventType.message;
      }
      const message = event.message;
      if ('quick_reply' in message) {
        this._adapter.messageType = IncomingMessageType.quick_reply;
      } else if ('text' in message) {
        this._adapter.messageType = IncomingMessageType.message;
      } else if (
        message.attachments &&
        Array.isArray(message.attachments) &&
        message.attachments.length > 0
      ) {
        if (message.attachments[0].type === Messenger.AttachmentType.location) {
          this._adapter.messageType = IncomingMessageType.location;
        } else {
          this._adapter.messageType = IncomingMessageType.attachments;
        }
      } else {
        this._adapter.messageType = IncomingMessageType.unknown;
      }
    } else if ('postback' in event) {
      this._adapter.eventType = StdEventType.message;
      this._adapter.messageType = IncomingMessageType.postback;
    } else if ('delivery' in event) {
      this._adapter.eventType = StdEventType.delivery;
    } else if ('read' in event) {
      this._adapter.eventType = StdEventType.read;
    } else {
      this._adapter.eventType = StdEventType.unknown;
    }
    this._adapter.raw = event;
  }

  /**
   * Returns channel related data
   *
   * @returns Channel related data
   */
  getChannelData(): any {
    return this.get('channelData', {});
  }

  /**
   * Returns the message id
   *
   * @returns Message ID
   */
  getId(): string {
    // Either event type is a message or a message echo
    if ('message' in this._adapter.raw) {
      if (this._adapter.raw.message.mid) {
        return this._adapter.raw.message.mid;
      }
      throw new Error('The message id `mid` is missing');
    }
    throw new Error(
      'The id (`mid`) is only available in message events (excluding postbacks)',
    );
  }

  /**
   * Returns event sender (subscriber) id in Facebook
   *
   * @returns Subscriber foreign ID
   */
  getSenderForeignId(): string {
    return this._adapter.raw.sender.id;
  }

  /**
   * Returns event recipient id
   *
   * @returns Subscriber foreign ID
   */
  getRecipientForeignId(): string {
    return this._adapter.raw.recipient.id;
  }

  /**
   * Returns the type of event received
   *
   * @returns Standard event type
   */
  getEventType(): StdEventType {
    return this._adapter.eventType;
  }

  /**
   * Finds out and return the type of the event recieved from messenger
   *
   * @returns The type of message
   */
  getMessageType(): IncomingMessageType {
    return this._adapter.messageType || IncomingMessageType.unknown;
  }

  /**
   * Return payload whenever user clicks on a button/quick_reply or sends an attachment
   *
   * @returns The payload content
   */
  getPayload(): Payload | string | undefined {
    if (this._adapter.eventType === StdEventType.message) {
      switch (this._adapter.messageType) {
        case IncomingMessageType.postback:
          return this._adapter.raw.postback.payload;

        case IncomingMessageType.quick_reply:
          return this._adapter.raw.message.quick_reply.payload;

        case IncomingMessageType.location: {
          const coordinates =
            this._adapter.raw.message.attachments[0].payload.coordinates;
          return {
            type: PayloadType.location,
            coordinates: {
              lat: coordinates?.lat || 0,
              lon: coordinates?.long || 0,
            },
          };
        }

        case IncomingMessageType.attachments: {
          const attachment: Messenger.Attachment =
            this._adapter.raw.message.attachments[0];
          return {
            type: PayloadType.attachments,
            attachments: {
              type: <FileType>(<unknown>attachment.type),
              payload: {
                url: attachment?.payload?.url || '',
              },
            },
          };
        }
      }
    }
    return undefined;
  }

  /**
   * Return a standard message format that can be stored in DB
   *
   * @returns  Received message in standard format
   */
  getMessage(): StdIncomingMessage {
    if (
      [StdEventType.message, StdEventType.echo].indexOf(
        this._adapter.eventType,
      ) === -1
    ) {
      throw new Error('Called getMessage() on a non-message event');
    }

    switch (this._adapter.messageType) {
      case IncomingMessageType.message:
        return {
          text: this._adapter.raw.message.text,
        };

      case IncomingMessageType.postback:
        return {
          postback: this._adapter.raw.postback.payload,
          text: this._adapter.raw.postback.title,
        };

      case IncomingMessageType.quick_reply:
        return {
          postback: this._adapter.raw.message.quick_reply.payload,
          text: this._adapter.raw.message.text,
        };
      case IncomingMessageType.location: {
        const coordinates =
          this._adapter.raw.message.attachments[0].payload.coordinates;
        return {
          type: PayloadType.location,
          coordinates: {
            lat: coordinates?.lat || 0,
            lon: coordinates?.long || 0,
          },
        };
      }
      case IncomingMessageType.attachments: {
        const attachments = this._adapter.raw.message.attachments;
        let serialized_text = 'attachment:';
        if (attachments[0].type === Messenger.AttachmentType.fallback) {
          // Handle fallback
          serialized_text += 'fallback';
        } else if (
          attachments[0].payload &&
          attachments[0].payload.sticker_id
        ) {
          // Handle stickers
          serialized_text += `sticker:${attachments[0].payload.sticker_id}`;
        } else {
          serialized_text += `${attachments[0].type}:${attachments[0].payload.url}`;
        }
        const stdAttachments = attachments.map((att) => {
          return {
            type: Object.values(FileType).includes(
              <FileType>(<unknown>att.type),
            )
              ? <FileType>(<unknown>att.type)
              : FileType.unknown,
            payload: {
              url: att.payload.url || '',
            },
          };
        });
        return {
          type: PayloadType.attachments,
          serialized_text,
          attachment:
            stdAttachments.length > 0 ? stdAttachments[0] : stdAttachments,
        };
      }
      default:
        throw new Error('Unknown incoming message type');
    }
  }

  /**
   * Return the list of recieved attachments
   * @deprecated
   * @returns Received attachments message
   */
  getAttachments(): AttachmentPayload<AttachmentForeignKey>[] {
    return this._adapter.eventType === StdEventType.message &&
      this._adapter.messageType === IncomingMessageType.attachments
      ? [].concat(this._adapter.raw.message.attachments as any)
      : [];
  }

  /**
   * Return the delivered messages ids
   *
   * @returns return delivered messages ids
   */
  getDeliveredMessages(): string[] {
    return this.getEventType() === StdEventType.delivery
      ? (<Messenger.MessageDeliveryEvent>this._adapter.raw).delivery.mids
      : [];
  }

  /**
   * Return the message's watermark
   *
   * @returns The watermark
   */
  getWatermark() {
    return this.getEventType() === StdEventType.read
      ? (<Messenger.MessageReadEvent>this._adapter.raw).read.watermark
      : 0;
  }
}
