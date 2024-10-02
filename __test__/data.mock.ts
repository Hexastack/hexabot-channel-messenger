/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { textMessage } from '@/channel/lib/__test__/common.mock';
import { VIEW_MORE_PAYLOAD } from '@/chat/helpers/constants';
import { ButtonType } from '@/chat/schemas/types/button';
import { QuickReplyType } from '@/chat/schemas/types/quick-reply';

import { Messenger } from '../types';

export const messengerText: Messenger.OutgoingMessageBase = textMessage;

export const messengerQuickReplies: Messenger.OutgoingMessageBase = {
  text: 'Choose one option',
  quick_replies: [
    {
      content_type: QuickReplyType.text,
      title: 'First option',
      payload: 'first_option',
    },
    {
      content_type: QuickReplyType.text,
      title: 'Second option',
      payload: 'second_option',
    },
  ],
};

export const messengerButtons: Messenger.OutgoingMessageBase = {
  attachment: {
    type: Messenger.TemplateType.template,
    payload: {
      template_type: Messenger.TemplateType.button,
      text: 'Hit one of these buttons :',
      buttons: [
        {
          type: ButtonType.postback,
          title: 'First button',
          payload: 'first_button',
        },
        {
          type: ButtonType.web_url,
          title: 'Second button',
          url: 'http://button.com',
          messenger_extensions: true,
          webview_height_ratio: 'compact',
        },
      ],
    },
  },
};

export const messengerList: Messenger.OutgoingMessageBase = {
  attachment: {
    type: Messenger.TemplateType.template,
    payload: {
      template_type: Messenger.TemplateType.generic,
      elements: [
        {
          title: 'First',
          subtitle: 'About being first',
          image_url:
            'http://localhost:4000/attachment/download/1/attachment.jpg',
          buttons: [
            {
              type: ButtonType.postback,
              title: 'More',
              payload: 'More:First',
            },
          ],
        },
        {
          title: 'Second',
          subtitle: 'About being second',
          image_url:
            'http://localhost:4000/attachment/download/1/attachment.jpg',
          buttons: [
            {
              type: ButtonType.postback,
              title: 'More',
              payload: 'More:Second',
            },
          ],
        },
        {
          title: 'More',
          subtitle: 'Click on the button below to view more of the content',
          buttons: [
            {
              type: ButtonType.postback,
              title: 'View More',
              payload: VIEW_MORE_PAYLOAD,
            },
          ],
        },
      ],
    },
  },
};

export const messengerCarousel: Messenger.OutgoingMessageBase = {
  attachment: {
    type: Messenger.TemplateType.template,
    payload: {
      template_type: Messenger.TemplateType.generic,
      elements: [
        {
          title: 'First',
          subtitle: 'About being first',
          image_url:
            'http://localhost:4000/attachment/download/1/attachment.jpg',
          buttons: [
            {
              type: ButtonType.postback,
              title: 'More',
              payload: 'More:First',
            },
          ],
        },
        {
          title: 'Second',
          subtitle: 'About being second',
          image_url:
            'http://localhost:4000/attachment/download/1/attachment.jpg',
          buttons: [
            {
              type: ButtonType.postback,
              title: 'More',
              payload: 'More:Second',
            },
          ],
        },
      ],
    },
  },
};

export const messengerAttachment: Messenger.OutgoingMessageBase = {
  attachment: {
    type: Messenger.AttachmentType.image,
    payload: {
      url: 'http://localhost:4000/attachment/download/1/attachment.jpg',
      is_reusable: false,
    },
  },
  quick_replies: [
    {
      content_type: QuickReplyType.text,
      title: 'Next >',
      payload: 'NEXT',
    },
  ],
};
