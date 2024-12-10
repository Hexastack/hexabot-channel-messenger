/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FileType } from '@/chat/schemas/types/attachment';
import {
  IncomingMessageType,
  PayloadType,
  StdEventType,
  StdIncomingAttachmentMessage,
  StdIncomingLocationMessage,
  StdIncomingPostBackMessage,
} from '@/chat/schemas/types/message';
import { Payload } from '@/chat/schemas/types/quick-reply';

import { Messenger } from '../types';

const img_url =
  'http://demo.hexabot.io/attachment/download/5c334078e2c41d11206bd152/myimage.png';

const payloadEvent: Messenger.IncomingMessage<Messenger.IncomingPostback> = {
  sender: {
    id: '2743096055733217',
  },
  recipient: {
    id: '219372162010940',
  },
  timestamp: 1584118824568,
  postback: {
    title: 'Get Started',
    payload: 'GET_STARTED',
  },
};

const textEvent: Messenger.IncomingMessage<
  Messenger.IncomingAnyMessage<Messenger.IncomingTextMessage>
> = {
  sender: {
    id: '2743096055733217',
  },
  recipient: {
    id: '219372162010940',
  },
  timestamp: 1584118824568,
  message: {
    mid: 'text-event-id',
    text: 'Hello world',
    nlp: {
      entities: {},
    },
  },
};

const echoEvent: Messenger.IncomingMessage<
  Messenger.IncomingAnyMessage<Messenger.IncomingTextMessage>
> = {
  sender: {
    id: '219372162010940',
  },
  recipient: {
    id: '2743096055733217',
  },
  timestamp: 1584118824968,
  message: {
    mid: 'echo-event-id',
    text: 'Hello back',
    is_echo: true,
    nlp: {
      entities: {},
    },
  },
};

const locationEvent: Messenger.IncomingMessage<
  Messenger.IncomingAnyMessage<Messenger.IncomingAttachmentMessage>
> = {
  message: {
    mid: 'location-event-id',
    attachments: [
      {
        type: Messenger.AttachmentType.location,
        payload: {
          coordinates: {
            lat: 2.0545,
            long: 12.2558,
          },
        },
      },
    ],
  },
  sender: {
    id: '15841188',
  },
  recipient: {
    id: '15841183',
  },
  timestamp: 52477,
};

const fileEvent: Messenger.IncomingMessage<
  Messenger.IncomingAnyMessage<Messenger.IncomingAttachmentMessage>
> = {
  sender: {
    id: '2743096055733217',
  },
  recipient: {
    id: '219372162010940',
  },
  timestamp: 1584031883977,
  message: {
    mid: 'file-event-id',
    attachments: [
      {
        type: Messenger.AttachmentType.image,
        payload: {
          url: img_url,
        },
      },
    ],
  },
};

export const messengerEvents: [string, Messenger.IncomingMessage, any][] = [
  [
    'Payload Event',
    payloadEvent,
    {
      channelData: {},
      id: undefined,
      eventType: IncomingMessageType.message,
      messageType: IncomingMessageType.postback,
      payload: payloadEvent.postback.payload,
      message: {
        postback: payloadEvent.postback.payload,
        text: payloadEvent.postback.title,
      } as StdIncomingPostBackMessage,
    },
  ],
  [
    'Text Event',
    textEvent,
    {
      channelData: {},
      id: textEvent.message.mid,
      eventType: IncomingMessageType.message,
      messageType: IncomingMessageType.message,
      payload: undefined,
      message: {
        text: textEvent.message.text,
      },
    },
  ],
  [
    'Echo Event',
    echoEvent,
    {
      channelData: {},
      id: echoEvent.message.mid,
      eventType: StdEventType.echo,
      messageType: IncomingMessageType.message,
      payload: undefined,
      message: {
        text: echoEvent.message.text,
      },
    },
  ],
  [
    'File Event',
    fileEvent,
    {
      channelData: {},
      id: fileEvent.message.mid,
      eventType: IncomingMessageType.message,
      messageType: IncomingMessageType.attachments,
      payload: {
        type: PayloadType.attachments,
        attachments: {
          type: FileType.image,
          payload: {
            url: img_url,
          },
        },
      } as Payload,
      message: {
        type: PayloadType.attachments,
        attachment: {
          payload: {
            url: img_url,
          },
          type: FileType.image,
        },
        serialized_text: `attachment:image:${img_url}`,
      } as StdIncomingAttachmentMessage,
    },
  ],
  [
    'Location Event',
    locationEvent,
    {
      channelData: {},
      id: locationEvent.message.mid,
      eventType: IncomingMessageType.message,
      messageType: IncomingMessageType.location,
      payload: {
        type: PayloadType.location,
        coordinates: {
          lat: locationEvent.message.attachments[0].payload.coordinates?.lat,
          lon: locationEvent.message.attachments[0].payload.coordinates?.long,
        },
      } as Payload,
      message: {
        type: PayloadType.location,
        coordinates: {
          lat: locationEvent.message.attachments[0].payload.coordinates?.lat,
          lon: locationEvent.message.attachments[0].payload.coordinates?.long,
        },
      } as StdIncomingLocationMessage,
    },
  ],
];
