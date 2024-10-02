/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { WebUrlButton, Button } from '@/chat/schemas/types/button';
import { StdQuickReply } from '@/chat/schemas/types/quick-reply';

export namespace Messenger {
  export enum SettingLabel {
    app_secret = 'app_secret',
    access_token = 'access_token',
    verify_token = 'verify_token',
    get_started_button = 'get_started_button',
    composer_input_disabled = 'composer_input_disabled',
    greeting_text = 'greeting_text',
    page_id = 'page_id',
    app_id = 'app_id',
    user_fields = 'user_fields',
  }

  export type Settings = Record<SettingLabel, any>;

  export enum AttachmentType {
    audio = 'audio',
    file = 'file',
    image = 'image',
    video = 'video',
    location = 'location',
    fallback = 'fallback',
  }

  export interface Attachment {
    type: AttachmentType;
    payload: {
      // Applicable to attachment type: audio, file, image, location, video, fallback
      url?: string;
      // Title of the attachment. Applicable to attachment type: fallback
      title?: string;
      // Applicable to attachment type: image
      sticker_id?: string;
      // Applicable to attachment type: location
      coordinates?: {
        lat: number;
        long: number;
      };
    };
  }

  export interface MessagingEvent {
    sender: {
      id: string; // PSID
    };
    recipient: {
      id: string; // PAGE_ID
    };
    timestamp: number;
  }

  export type IncomingMessageBase = {
    mid: string;
    // Reference to the message ID that this message is replying to
    reply_to?: {
      mid: string;
    };
    // Applicable when FB NLP is enabled
    nlp?: {
      entities: any;
    };
    // Indicates the message sent from the page itself
    is_echo?: boolean;
  };

  // See docs : https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_postbacks
  export interface IncomingPostback {
    postback: {
      title: string; // call to action title
      payload: string;
      // Currently not used (https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_referrals)
      referral?: {
        ref: string; // User defined referal param
        source: string; // MESSENGER_CODE, DISCOVER_TAB, ADS, SHORTLINK, CUSTOMER_CHAT_PLUGIN
        type: string; // OPEN_THREAD ,
        referer_uri: string; // The URI of the site where the message was sent in the customer chat plugin.
      };
    };
  }

  export type IncomingTextMessage = { text: string };

  export type IncomingQuickReplyMessage = IncomingTextMessage & {
    quick_reply: { payload: string };
  };

  export type IncomingAttachmentMessage = { attachments: Attachment[] };

  export type IncomingAnyMessage<
    M =
      | IncomingTextMessage
      | IncomingQuickReplyMessage
      | IncomingAttachmentMessage,
  > = {
    message: IncomingMessageBase & M;
  };

  // See docs : https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
  export type IncomingMessage<T = IncomingPostback | IncomingAnyMessage> =
    MessagingEvent & T;

  // See docs : https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-reads
  export interface MessageReadEvent extends MessagingEvent {
    read: {
      watermark: number;
    };
  }

  // See docs : https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-deliveries
  export interface MessageDeliveryEvent extends MessagingEvent {
    delivery: {
      mids: string[];
      watermark: string;
    };
  }

  // Applicable only to webhook events :
  // messages, messaging_postbacks, message_deliveries, message_reads
  export type Event = MessageReadEvent | MessageDeliveryEvent | IncomingMessage;

  export interface GreetingText {
    locale: string; // Default, fr, en ...
    text: string;
  }

  export enum TopElementStyle {
    large = 'large',
    compact = 'compact',
  }

  export interface MessageElement {
    title: string;
    subtitle?: string;
    image_url?: string;
    default_action?: Omit<WebUrlButton, 'title'>;
    buttons?: Button[];
  }

  export enum ImageAspectRatio {
    horizontal = 'horizontal',
    square = 'square',
  }

  export enum TemplateType {
    button = 'button',
    template = 'template',
    generic = 'generic',
    list = 'list',
  }

  export interface TemplateButtons {
    template_type: TemplateType.button;
    text: string;
    buttons: Button[];
  }

  export interface TemplateGeneric {
    template_type: TemplateType.generic | TemplateType.list;
    elements: MessageElement[];
    buttons?: Button[];
    image_aspect_ratio?: ImageAspectRatio;
    top_element_style?: TopElementStyle;
  }

  export interface TemplateContent {
    type: TemplateType.template;
    payload: TemplateButtons | TemplateGeneric;
  }

  export interface TemplateFile {
    type: AttachmentType;
    payload: {
      url: string;
      is_reusable: boolean;
    };
  }

  export interface OutgoingMessageBase {
    text?: string;
    quick_replies?: StdQuickReply[];
    attachment?: TemplateContent | TemplateFile;
  }

  export type Recipient = {
    id: string;
  };

  export interface OutgoingMessage {
    recipient: Recipient;
    message: OutgoingMessageBase;
  }

  export enum ActionType {
    mark_seen = 'mark_seen',
    typing_on = 'typing_on',
    typing_off = 'typing_off',
  }

  export interface Action {
    recipient: Recipient;
    sender_action: ActionType;
  }

  export interface Label {
    //
    name?: string;
    //
    user?: string;
  }

  export type Profile =
    | {
        fields?: string | string[];
      }
    | {
        greeting?: GreetingText[];
      }
    | {
        get_started?: {
          payload: string;
        };
      }
    | {
        persistent_menu?: Array<{
          locale: string; // If it's not an array of locales, we'll assume is an array of buttons.
          composer_input_disabled: boolean;
          call_to_actions: any;
        }>;
      };

  export type RequestBody =
    | OutgoingMessage
    | Profile
    | Label
    | Action
    | string
    | BroadcastMessage
    | { messages: OutgoingMessageBase[] };

  export type Message = OutgoingMessage | IncomingMessage;

  export enum MessageTag {
    'COMMUNITY_ALERT',
    'CONFIRMED_EVENT_REMINDER',
    'NON_PROMOTIONAL_SUBSCRIPTION',
    'PAIRING_UPDATE',
    'APPLICATION_UPDATE',
    'ACCOUNT_UPDATE',
    'PAYMENT_UPDATE',
    'PERSONAL_FINANCE_UPDATE',
    'SHIPPING_UPDATE',
    'RESERVATION_UPDATE',
    'ISSUE_RESOLUTION',
    'APPOINTMENT_UPDATE',
    'GAME_EVENT',
    'TRANSPORTATION_UPDATE',
    'FEATURE_FUNCTIONALITY_UPDATE',
    'TICKET_UPDATE',
  }

  export enum NotificationType {
    'REGULAR',
    'SILENT_PUSH',
    'NO_PUSH',
  }

  export interface BroadcastMessage {
    message_creative_id: string;
    notification_type: NotificationType;
    tag: MessageTag;
    custom_label_id?: string;
  }

  export type UserData = {
    id: string;
    first_name: string;
    last_name: string;
    profile_pic: string;
    locale: string;
    timezone: number;
    gender: string;
  };
}
