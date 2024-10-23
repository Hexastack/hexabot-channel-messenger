/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import {
  attachmentMessage,
  buttonsMessage,
  contentMessage,
  quickRepliesMessage,
  textMessage,
} from '@/channel/lib/__test__/common.mock';
import { LabelRepository } from '@/chat/repositories/label.repository';
import { MessageRepository } from '@/chat/repositories/message.repository';
import { SubscriberRepository } from '@/chat/repositories/subscriber.repository';
import { LabelModel } from '@/chat/schemas/label.schema';
import { MessageModel } from '@/chat/schemas/message.schema';
import { SubscriberModel } from '@/chat/schemas/subscriber.schema';
import { OutgoingMessageFormat } from '@/chat/schemas/types/message';
import { LabelService } from '@/chat/services/label.service';
import { MessageService } from '@/chat/services/message.service';
import { SubscriberService } from '@/chat/services/subscriber.service';
import { MenuRepository } from '@/cms/repositories/menu.repository';
import { MenuModel } from '@/cms/schemas/menu.schema';
import { MenuService } from '@/cms/services/menu.service';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageModel } from '@/i18n/schemas/language.schema';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { NlpService } from '@/nlp/services/nlp.service';
import { SettingService } from '@/setting/services/setting.service';
import { installSubscriberFixtures } from '@/utils/test/fixtures/subscriber';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import MessengerHandler from '../index.channel';
import {
  messengerAttachment,
  messengerButtons,
  messengerCarousel,
  messengerList,
  messengerQuickReplies,
  messengerText,
} from './data.mock';

describe('Messenger Handler', () => {
  let handler: MessengerHandler;
  const messengerSettings = {};

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(async () => {
          await installSubscriberFixtures();
        }),
        MongooseModule.forFeature([
          SubscriberModel,
          AttachmentModel,
          MessageModel,
          MenuModel,
          LabelModel,
          LanguageModel,
        ]),
      ],
      providers: [
        {
          provide: SettingService,
          useValue: {
            getConfig: jest.fn(() => ({
              chatbot: { lang: { default: 'fr' } },
            })),
            getSettings: jest.fn(() => ({
              messenger: messengerSettings,
            })),
          },
        },
        {
          provide: NlpService,
          useValue: {
            getNLP: jest.fn(() => undefined),
          },
        },
        ChannelService,
        SubscriberService,
        SubscriberRepository,
        AttachmentService,
        AttachmentRepository,
        MessageService,
        MessageRepository,
        MenuService,
        MenuRepository,
        LabelService,
        LabelRepository,
        LanguageService,
        LanguageRepository,
        MessengerHandler,
        EventEmitter2,
        LoggerService,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            request: jest.fn(),
          },
        },
      ],
    }).compile();
    handler = module.get<MessengerHandler>(MessengerHandler);
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  it('should have correct name', () => {
    expect(handler).toBeDefined();
    expect(handler.getName()).toEqual('messenger-channel');
  });

  it('should format text properly', () => {
    const formatted = handler._textFormat(textMessage, {});
    expect(formatted).toEqual(messengerText);
  });

  it('should format quick replies properly', () => {
    const formatted = handler._quickRepliesFormat(quickRepliesMessage, {});
    expect(formatted).toEqual(messengerQuickReplies);
  });

  it('should format buttons properly', () => {
    const formatted = handler._buttonsFormat(buttonsMessage, {});
    expect(formatted).toEqual(messengerButtons);
  });

  it('should format list properly', () => {
    const formatted = handler._listFormat(contentMessage, {
      content: contentMessage.options,
    });
    expect(formatted).toEqual(messengerList);
  });

  it('should format carousel properly', () => {
    const formatted = handler._carouselFormat(contentMessage, {
      content: {
        ...contentMessage.options,
        display: OutgoingMessageFormat.carousel,
      },
    });
    expect(formatted).toEqual(messengerCarousel);
  });

  it('should format attachment properly', () => {
    const formatted = handler._attachmentFormat(attachmentMessage, {});
    expect(formatted).toEqual(messengerAttachment);
  });
});
