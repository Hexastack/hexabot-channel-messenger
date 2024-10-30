/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import crypto from 'crypto';

import { HttpService } from '@nestjs/axios';
import { Injectable, RawBodyRequest } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NextFunction, Request, Response } from 'express';
import { TFilterQuery } from '@/utils/types/filter.types';
import fetch from 'node-fetch';

import { Attachment } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import EventWrapper from '@/channel/lib/EventWrapper';
import ChannelHandler from '@/channel/lib/Handler';
import { SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import { VIEW_MORE_PAYLOAD } from '@/chat/helpers/constants';
import { Label, LabelDocument } from '@/chat/schemas/label.schema';
import { Subscriber } from '@/chat/schemas/subscriber.schema';
import { WithUrl } from '@/chat/schemas/types/attachment';
import { Button, ButtonType } from '@/chat/schemas/types/button';
import {
  OutgoingMessageFormat,
  StdEventType,
  StdOutgoingAttachmentMessage,
  StdOutgoingButtonsMessage,
  StdOutgoingEnvelope,
  StdOutgoingListMessage,
  StdOutgoingQuickRepliesMessage,
  StdOutgoingTextMessage,
} from '@/chat/schemas/types/message';
import { BlockOptions } from '@/chat/schemas/types/options';
import { LabelService } from '@/chat/services/label.service';
import { MessageService } from '@/chat/services/message.service';
import { SubscriberService } from '@/chat/services/subscriber.service';
import { Content } from '@/cms/schemas/content.schema';
import { MenuTree } from '@/cms/schemas/types/menu';
import { MenuService } from '@/cms/services/menu.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { Setting } from '@/setting/schemas/setting.schema';
import { CheckboxSetting, TextareaSetting } from '@/setting/schemas/types';
import { SettingService } from '@/setting/services/setting.service';
import { BaseSchema } from '@/utils/generics/base-schema';

import { ChannelName } from '@/channel/types';
import { GraphApi } from './lib/graph-api';
import { MESSENGER_CHANNEL_NAME } from './settings';
import { Messenger } from './types';
import MessengerEventWrapper from './wrapper';

@Injectable()
export default class MessengerHandler extends ChannelHandler<
  typeof MESSENGER_CHANNEL_NAME
> {
  protected api: GraphApi;

  constructor(
    settingService: SettingService,
    channelService: ChannelService,
    logger: LoggerService,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly i18n: I18nService,
    protected readonly languageService: LanguageService,
    protected readonly subscriberService: SubscriberService,
    protected readonly attachmentService: AttachmentService,
    protected readonly messageService: MessageService,
    protected readonly menuService: MenuService,
    protected readonly labelService: LabelService,
    protected readonly httpService: HttpService,
  ) {
    super(MESSENGER_CHANNEL_NAME, settingService, channelService, logger);
  }

  getPath(): string {
    return __dirname;
  }

  /**
   * Logs a debug message indicating the initialization of the Messenger Channel Handler.
   */
  async init(): Promise<void> {
    this.logger.debug('Messenger Channel Handler : initialization ...');

    const settings = await this.getSettings();
    this.api = new GraphApi(
      this.httpService,
      settings ? settings.access_token : '',
    );
  }

  /**
   * Sync label(s) with Facebook.
   *
   * @param label
   * @param callback
   */
  @OnEvent('hook:label:create')
  async onLabelCreate(
    label: LabelDocument,
    callback: (result: Record<string, string>) => Promise<void>,
  ): Promise<void> {
    try {
      const { id } = await this.api.customLabels.createCustomLabel(label.name);
      await callback({
        [this.getName()]: id,
      });
      this.logger.debug(
        'Messenger Channel Handler : Successfully synced label',
      );
    } catch (err) {
      this.logger.error(
        'Messenger Channel Handler : Failed to sync label',
        err,
      );
    }
  }

  /**
   * Sync label(s) with Facebook.
   *
   * @param labels
   */
  @OnEvent('hook:label:delete')
  async onLabelDelete(labels: Label[]): Promise<void> {
    try {
      await Promise.all(
        labels
          .filter((label) => {
            return this.getName() in label.label_id;
          })
          .map((label) => {
            return this.api.customLabels.deleteCustomLabel(
              label.label_id[this.getName()],
            );
          }),
      );
      this.logger.debug(
        'Messenger Channel Handler : Successfully removed label(s)',
      );
    } catch (err) {
      this.logger.error(
        'Messenger Channel Handler : Failed to remove label(s)',
        err,
      );
    }
  }

  /**
   * Handles subscriber update events before they occur.
   *
   * This method checks if the subscriber exists and then updates their labels
   *
   * @param criteria - The criteria to find the subscriber.
   * @param updates - The updates to apply to the subscriber.
   * @returns A promise that resolves when the update handling is complete.
   */
  @OnEvent('hook:subscriber:preUpdate')
  async handleSubscriberUpdate(
    criteria: string | TFilterQuery<Subscriber>,
    updates: Partial<Omit<Subscriber, keyof BaseSchema>>,
  ): Promise<void> {
    try {
      const oldSubscriber =
        await this.subscriberService.findOneAndPopulate(criteria);

      if (!oldSubscriber) {
        this.logger.error(
          'Messenger Channel Handler : Unable to sync user labels: Subscriber(s) not found ',
          criteria,
          oldSubscriber.id,
        );
        return;
      }

      if (updates.labels) {
        const labels = await this.labelService.find({
          _id: { $in: updates.labels },
        });

        const channel = this.getName();

        const difference = (a: string[], b: string[]) =>
          a.filter((x: string) => !b.includes(x));

        const oldLabelIds = oldSubscriber.labels
          .map((l) => (channel in l.label_id ? l.label_id[channel] : null))
          .filter((id) => !!id);

        const newLabelIds = labels
          .map((l) => (channel in l.label_id ? l.label_id[channel] : null))
          .filter((id) => !!id);

        const diff = difference(oldLabelIds, newLabelIds).concat(
          difference(newLabelIds, oldLabelIds),
        );

        if (diff.length > 0) {
          const res = await this.updateUserLabels(
            oldSubscriber.foreign_id,
            oldLabelIds,
            newLabelIds,
          );
          this.logger.debug(
            'Messenger Channel Handler : Successfully assigned label to user ',
            res,
            oldSubscriber.id,
          );
        }
      }
    } catch (err) {
      this.logger.warn(
        'Messenger Channel Handler : Unable to sync updates',
        err,
      );
    }
  }

  /**
   * Configures messenger welcome text.
   *
   * @param setting - Greeting text setting.
   */
  @OnEvent('hook:messenger_channel:greeting_text')
  async onGreetingTextUpdate(setting: TextareaSetting): Promise<void> {
    try {
      await this._setGreetingText(setting.value);
      this.logger.log(
        'Messenger Channel Handler : Greeting message has been updated',
        setting,
      );
    } catch (err) {
      this.logger.error(
        'Messenger Channel Handler : Unable to update greeting message',
        err,
      );
    }
  }

  /**
   * Enables/Disables Get Started button in messenger.
   *
   * @param setting
   */
  @OnEvent('hook:messenger_channel:get_started_button')
  async onToggleGetStartedButton(setting: CheckboxSetting): Promise<void> {
    try {
      if (setting.value) {
        await this._setGetStartedButton();
        await this._setPersistentMenu();
      } else {
        // You must set a `Get Started` button if you also wish to use a persistent menu.
        await this._deletePersistentMenu();
        await this._deleteGetStartedButton();
      }

      this.logger.log(
        'Messenger Channel Handler : `Get started` button has been updated',
        setting,
      );
    } catch (err) {
      this.logger.error(
        'Messenger Channel Handler : Unable to update `Get started` button',
        err,
      );
    }
  }

  /**
   * Configures access token.
   *
   * @param setting - Access token setting.
   */
  @OnEvent('hook:messenger_channel:access_token')
  async onAccessTokenUpdate(setting: Setting): Promise<void> {
    this.api = new GraphApi(this.httpService, setting.value);
  }

  /**
   * Enables/Disables composer input button in messenger.
   *
   * @param setting
   */
  @OnEvent('hook:messenger_channel:composer_input_disabled')
  async onToggleComposerInput(setting: CheckboxSetting): Promise<void> {
    try {
      await this._setPersistentMenu(setting.value);
      this.logger.log(
        'Messenger Channel Handler : `Composer Input` has been updated',
        setting,
      );
    } catch (err) {
      this.logger.error(
        'Messenger Channel Handler : Unable to update `Composer Input`',
        err,
      );
    }
  }

  /**
   * Updates messenger persistent menu.
   */
  @OnEvent('hook:menu:*')
  async onMenuUpdate(): Promise<void> {
    try {
      await this._setPersistentMenu();
      this.logger.log(
        'Messenger Channel Handler : `Persistent Menu` has been updated',
      );
    } catch (err) {
      this.logger.error(
        'Messenger Channel Handler : Unable to update `Persistent Menu`',
        err,
      );
    }
  }

  /**
   * Computes the expected hash signature.
   *
   * @param req - The HTTP request object.
   * @param res - The HTTP response object.
   */
  async middleware(
    req: RawBodyRequest<Request>,
    _res: Response,
    next: NextFunction,
  ) {
    const signature: string = req.headers['x-hub-signature'] as string;

    // This request is not from messenger ?
    if (!signature) {
      return next();
    }

    const settings = await this.getSettings();
    const expectedHash = crypto
      .createHmac('sha1', settings.app_secret)
      .update(req.rawBody)
      .digest('hex');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    req.messenger = { expectedHash };
    next();
  }

  /**
   * Verify the signature of the request issued by Facebook Messenger.
   *
   * @param req - The HTTP request object.
   * @param res - The HTTP response object.
   * @param next - Callback
   */
  _verifySignature(req: Request, res: Response, next: () => void) {
    const signature: string = req.headers['x-hub-signature'] as string;
    const elements: string[] = signature.split('=');
    const signatureHash = elements[1];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const expectedHash =
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      req.messenger && req.messenger.expectedHash
        ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          req.messenger.expectedHash
        : '';

    if (signatureHash !== expectedHash) {
      this.logger.warn(
        "Messenger Channel Handler : Couldn't match the request signature.",
        signatureHash,
        expectedHash,
      );
      return res
        .status(500)
        .json({ err: "Couldn't match the request signature." });
    }
    this.logger.debug(
      'Messenger Channel Handler : Request signature has been validated.',
    );
    return next();
  }

  /**
   * Makes sure that all required fields exists.
   *
   * @param req - The HTTP request object.
   * @param res - The HTTP response object.
   * @param next - Callback
   */
  _validateMessage(req: Request, res: Response, next: () => void) {
    const data: any = req.body;

    if (data.object !== 'page') {
      this.logger.warn(
        'Messenger Channel Handler : Missing `page` attribute!',
        data,
      );
      return res.status(400).json({ err: 'The page parameter is missing!' });
    }
    return next();
  }

  /**
   * Allows the subscription to a messenger's webhook after verification
   *
   * @param req - The HTTP request object.
   * @param res - The HTTP response object.
   */
  async subscribe(req: Request, res: Response) {
    const data: any = req.query;
    const settings = await this.getSettings();
    const verifyToken: string = settings.verify_token;

    if (!verifyToken) {
      return res.status(500).json({
        err: 'Messenger Channel Handler : You need to specify a verifyToken in your config.',
      });
    }
    if (!data || !data['hub.mode'] || !data['hub.verify_token']) {
      return res.status(500).json({
        err: 'Messenger Channel Handler : Did not recieve any verification token.',
      });
    }
    if (
      data['hub.mode'] === 'subscribe' &&
      data['hub.verify_token'] === verifyToken
    ) {
      this.logger.log(
        'Messenger Channel Handler : Subscription token has been verified successfully!',
      );
      return res.status(200).send(data['hub.challenge']);
    } else {
      this.logger.error(
        'Messenger Channel Handler : Failed validation. Make sure the validation tokens match.',
      );
      return res.status(500).json({
        err: 'Messenger Channel Handler : Failed validation. Make sure the validation tokens match.',
      });
    }
  }

  /**
   * Processes incoming Messenger data (finding out its type and assigning it to its proper handler)
   *
   * @param req - The HTTP request object.
   * @param res - The HTTP response object.
   */
  async handle(req: Request, res: Response) {
    const handler: MessengerHandler = this;

    // Handle webhook subscribe notifications
    if (req.method === 'GET') {
      return await handler.subscribe(req, res);
    }

    // Handle incoming messages (through POST)
    return handler._verifySignature(req, res, () => {
      return handler._validateMessage(req, res, () => {
        const data = req.body;
        this.logger.debug(
          'Messenger Channel Handler : Webhook notification received.',
        );
        // Check notification
        if (!('entry' in data)) {
          this.logger.error(
            'Messenger Channel Handler : Webhook received no entry data.',
          );
          return res.status(500).json({
            err: 'Messenger Channel Handler : Webhook received no entry data.',
          });
        }

        // Iterate over each entry. There may be multiple messages if batched.
        data.entry.forEach((entry: any) => {
          // Iterate over each messaging event (in parallel)
          entry.messaging.forEach((e: Messenger.Event) => {
            try {
              const event = new MessengerEventWrapper(handler, e);
              const type: StdEventType = event.getEventType();
              if (type) {
                this.eventEmitter.emit(`hook:chatbot:${type}`, event);
              } else {
                this.logger.error(
                  'Messenger Channel Handler : Webhook received unknown event ',
                  event,
                );
              }
            } catch (err) {
              // if any of the events produced an error, err would equal that error
              this.logger.error(
                'Messenger Channel Handler : Something went wrong while handling events',
                err,
              );
            }
          });
        });
        return res.status(200).json({ success: true });
      });
    });
  }

  /**
   * Formats a text message that will be sent to Messenger
   *
   * @param message - A text to be sent to the end user
   * @param _options - might contain additional settings
   *
   * @returns A Messenger ready to be sent text message
   */
  _textFormat(
    message: StdOutgoingTextMessage,
    _options?: any,
  ): Messenger.OutgoingMessageBase {
    return {
      text: message.text,
    };
  }

  /**
   * Formats a text + quick replies message that can be sent to Messenger
   *
   * @param message - A text + quick replies to be sent to the end user
   * @param options - might contain additional settings
   *
   * @returns A Messenger ready to be sent text message
   */
  _quickRepliesFormat(
    message: StdOutgoingQuickRepliesMessage,
    _options?: any,
  ): Messenger.OutgoingMessageBase {
    return {
      text: message.text,
      quick_replies: message.quickReplies,
    };
  }

  /**
   * From raw buttons, construct a Messenger understandable message containing those buttons
   *
   * @param message - A text + buttons to be sent to the end user
   * @param _options - Might contain additional settings
   *
   * @returns A formatted Object understandable by Messenger
   */
  _buttonsFormat(
    message: StdOutgoingButtonsMessage,
    _options: BlockOptions,
  ): Messenger.OutgoingMessageBase {
    const payload: Messenger.TemplateButtons = {
      template_type: Messenger.TemplateType.button,
      text: message.text,
      buttons: message.buttons,
    };
    return this._formatTemplate(payload);
  }

  /**
   * Formats an attachment + quick replies message that can be sent to Messenger
   *
   * @param message - An attachment + quick replies to be sent to the end user
   * @param _options - Might contain additional settings
   *
   * @returns A Messenger ready to be sent attachment message
   */
  _attachmentFormat(
    message: StdOutgoingAttachmentMessage<WithUrl<Attachment>>,
    _options: BlockOptions,
  ): Messenger.OutgoingMessageBase {
    const payload: Messenger.OutgoingMessageBase = {
      attachment: {
        type: <Messenger.AttachmentType>(<unknown>message.attachment.type),
        payload: {
          url: message.attachment.payload.url,
          is_reusable: false,
        },
      },
    };
    if (message.quickReplies && message.quickReplies.length > 0) {
      payload.quick_replies = message.quickReplies;
    }
    return payload;
  }

  /**
   * Format a collection of items to be sent to Messenger (carousel/list)
   *
   * @param data - A list of data items to be sent to the end user
   * @param options - Might contain additional settings
   *
   * @returns A Messenger elements object
   */
  _formatElements(
    data: any[],
    options: BlockOptions,
  ): Messenger.MessageElement[] {
    if (!options.content || !options.content.fields) {
      throw new Error('Content options are missing the fields');
    }

    const fields = options.content.fields;
    const buttons: Button[] = options.content.buttons;
    return data.map((item) => {
      const element: Messenger.MessageElement = {
        title: item[fields.title],
        buttons: item.buttons || [],
      };
      if (fields.subtitle && item[fields.subtitle]) {
        element.subtitle = item[fields.subtitle];
      }

      if (fields.image_url && item[fields.image_url]) {
        const attachmentPayload = item[fields.image_url].payload;
        if (attachmentPayload.url) {
          if (!attachmentPayload.id) {
            // @deprecated
            this.logger.warn(
              'Messenger Channel Handler: Attachment remote url has been deprecated',
              item,
            );
          }
          element.image_url = attachmentPayload.url;
        }
      }

      buttons.forEach((button: Button, index) => {
        const btn = { ...button };
        if (btn.type === ButtonType.web_url) {
          // Get built-in or an external URL from custom field
          const urlField = fields.url;
          btn.url =
            urlField && item[urlField] ? item[urlField] : Content.getUrl(item);
          if (!btn.url.startsWith('http')) {
            btn.url = 'https://' + btn.url;
          }
          // Set default action the same as the first web_url button
          if (!element.default_action) {
            const { title: _title, ...rest } = btn;
            element.default_action = rest;
          }
        } else {
          const postback = Content.getPayload(item);
          btn.payload = btn.title + ':' + postback;
        }
        // Set custom title for first button if provided
        if (index === 0 && fields.action_title && item[fields.action_title]) {
          btn.title = item[fields.action_title];
        }
        element.buttons?.push(btn);
      });
      if (Array.isArray(element.buttons) && element.buttons.length === 0) {
        delete element.buttons;
      }
      return element;
    });
  }

  /**
   * Format a list template message that can be sent to Messenger
   *
   *      NOTE : List template on Messenger Platform is deprecated on API 4.0.
   *
   *      It will be removed from all versions soon. For this reason, the list
   *
   *      Will output a carousel with the last item being a "View more" CTAs
   *
   * @param message - Contains elements to be sent to the end user
   * @param options - Might contain additional settings
   *
   * @returns A Messenger ready to be sent list template message
   */
  _listFormat(
    message: StdOutgoingListMessage,
    options: BlockOptions,
  ): Messenger.OutgoingMessageBase {
    const data = message.elements || [];

    // Items count min check
    if (data.length === 0 || data.length > 9) {
      throw new Error('Invalid content count for list (0 < count <= 9)');
    }

    // Populate items (elements/cards) with content
    const elements = this._formatElements(data, options);
    const pagination = message.pagination;

    // Toggle "View More" button (check if there's more items to display)
    if (pagination.total - pagination.skip - pagination.limit > 0) {
      elements.push({
        title: this.i18n.t('More'),
        subtitle: this.i18n.t(
          'Click on the button below to view more of the content',
        ),
        buttons: [
          {
            type: ButtonType.postback,
            title: this.i18n.t('View More'),
            payload: VIEW_MORE_PAYLOAD,
          },
        ],
      });
    }

    const payload: Messenger.TemplateGeneric = {
      template_type: Messenger.TemplateType.generic,
      elements,
    };
    return this._formatTemplate(payload);
  }

  /**
   * Formats a generic template (Carousel) message that can be sent to Messenger
   *
   * @param message - Contains elements to be sent to the end user
   * @param options - Might contain additional settings
   *
   * @returns A Messenger ready to be sent generic template message
   */
  _carouselFormat(
    message: StdOutgoingListMessage,
    options: BlockOptions,
  ): Messenger.OutgoingMessageBase {
    const data = message.elements || [];
    let elements = [];
    // Items count min check
    if (data.length === 0 || data.length > 10) {
      throw new Error('Invalid content count for carousel (0 < count <= 10)');
    }

    // Populate items (elements/cards) with content
    elements = this._formatElements(data, options);
    const payload: Messenger.TemplateGeneric = {
      template_type: Messenger.TemplateType.generic,
      elements,
    };
    // options &&
    //   options.content.imageAspectRatio &&
    //   options.content.imageAspectRatio &&
    //   (payload.image_aspect_ratio = options.content.imageAspectRatio);
    return this._formatTemplate(payload);
  }

  /**
   * Creates a Messenger compliant template structure
   *
   * @param payload - The payload of the template
   * @returns A template filled with its payload
   */
  _formatTemplate(
    payload: Messenger.TemplateButtons | Messenger.TemplateGeneric,
  ): Messenger.OutgoingMessageBase {
    return {
      attachment: {
        type: Messenger.TemplateType.template,
        payload,
      },
    };
  }

  /**
   * Format any type of message
   *
   * @param envelope - The message standard envelope
   * @param options - The block options related to the message
   *
   * @returns A template filled with its payload
   */
  _formatMessage(
    envelope: StdOutgoingEnvelope,
    options: BlockOptions,
  ): Messenger.OutgoingMessageBase {
    switch (envelope.format) {
      case OutgoingMessageFormat.attachment:
        return this._attachmentFormat(envelope.message, options);
      case OutgoingMessageFormat.buttons:
        return this._buttonsFormat(envelope.message, options);
      case OutgoingMessageFormat.carousel:
        return this._carouselFormat(envelope.message, options);
      case OutgoingMessageFormat.list:
        return this._listFormat(envelope.message, options);
      case OutgoingMessageFormat.quickReplies:
        return this._quickRepliesFormat(envelope.message, options);
      case OutgoingMessageFormat.text:
        return this._textFormat(envelope.message, options);

      default:
        throw new Error('Unknown message format');
    }
  }

  /**
   * Sends a Messenger Message to the end-user (subscriber)
   *
   * @param event - Incoming event/message being responded to
   * @param envelope - The message to be sent {format, message}
   * @param options - Might contain additional settings
   * @param _context - Contextual data
   *
   * @returns The messenger's response, otherwise an error
   */
  async sendMessage(
    event: EventWrapper<any, any>,
    envelope: StdOutgoingEnvelope,
    options: BlockOptions,
    _context?: any,
  ): Promise<{ mid: string }> {
    const handler: MessengerHandler = this;
    const message = handler._formatMessage(envelope, options);

    const req = async function () {
      try {
        const res = await handler.api.send.call({
          recipient: {
            id: event.getSenderForeignId(),
          },
          message,
        });

        return { mid: res.message_id || '' };
      } catch (err) {
        throw err;
      }
    };

    if (options && options.typing) {
      const autoTimeout =
        message && message.text ? message.text.length * 10 : 1000;
      const timeout =
        typeof options.typing === 'number' ? options.typing : autoTimeout;

      try {
        await handler.sendTypingIndicator(event.getSenderForeignId(), timeout);
        return await req();
      } catch (err) {
        this.logger.error(
          'Messenger Channel Handler : Failed in sendTypingIndicator ',
          err,
        );
        throw err;
      }
    }

    return await req();
  }

  /**
   * Sends a typing indicator (waterline) to the end user for a given duration
   *
   * @param recipientId - The end user id within a facebook page scope
   * @param timeout - Duration of the typing indicator in milliseconds
   */
  async sendTypingIndicator(
    recipientId: string,
    timeout: number,
  ): Promise<any> {
    if (timeout > 20000) {
      timeout = 20000;
      this.logger.warn(
        'Messenger Channel Handler : Typing Indicator max milliseconds value is 20000 (20 seconds)',
      );
    }

    return new Promise(async (resolve, reject) => {
      try {
        await this.api.send.sendSenderAction({
          recipient: { id: recipientId },
          sender_action: Messenger.ActionType.typing_on,
        });

        setTimeout(async () => {
          try {
            const json: any = await this.api.send.sendSenderAction({
              recipient: { id: recipientId },
              sender_action: Messenger.ActionType.typing_off,
            });
            resolve(json);
          } catch (err) {
            reject(err);
          }
        }, timeout);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Fetches the end user profile data
   *
   * @param event - The message event received
   * @returns A promise that resolves to the messenger's response, otherwise an error
   */
  async getUserData(
    event: MessengerEventWrapper,
  ): Promise<SubscriberCreateDto> {
    const handler = this;
    const defaultUserFields =
      'first_name,last_name,profile_pic,locale,timezone,gender';
    const settings = await this.getSettings();
    const userFields = settings.user_fields || defaultUserFields;
    const profile = await handler.api.profile.getUserProfile(
      event.getSenderForeignId(),
      userFields,
    );

    // Save profile picture locally (messenger URL expires)
    if (profile.profile_pic) {
      fetch(profile.profile_pic, {})
        .then(async (res) => {
          this.attachmentService.uploadProfilePic(res, profile.id + '.jpeg');
        })
        .catch((err: Error) => {
          // Serve a generic picture instead depending on the file existence
          this.logger.error(
            'Messenger Channel Handler : Error while fetching profile picture',
            err,
          );
        });
    }

    const defautLanguage = await this.languageService.getDefaultLanguage();

    return {
      foreign_id: event.getSenderForeignId(),
      first_name: profile.first_name,
      last_name: profile.last_name,
      gender: profile.gender,
      channel: {
        name: handler.getName() as ChannelName,
      },
      assignedAt: null,
      assignedTo: null,
      labels: [],
      locale: profile.locale,
      language: defautLanguage.code,
      timezone: profile.timezone,
      country: '',
      lastvisit: new Date(),
      retainedFrom: new Date(),
    };
  }

  /**
   * Updates the subscriber's labels in Facebook
   *
   * @param subscriberForeignId - The end user id within a facebook page scope
   * @param oldLabels - Array of old labels
   * @param newLabels - Array of new labels
   *
   * @returns A promise that resolves to the messenger's response, otherwise an error
   */
  async updateUserLabels(
    subscriberForeignId: string,
    oldLabels: string[],
    newLabels: string[],
  ): Promise<any> {
    const deleted = oldLabels
      .filter((l) => !newLabels.includes(l))
      .map((labelId: string) => {
        return this.api.customLabels.removePsidfromCustomLabel(
          subscriberForeignId,
          labelId,
        );
      });
    const added = newLabels
      .filter((l) => !oldLabels.includes(l))
      .map((labelId: string) => {
        return this.api.customLabels.addPsidtoCustomLabel(
          subscriberForeignId,
          labelId,
        );
      });
    this.logger.debug(
      'Messenger Channel Handler : Sync user labels with API ... ',
    );

    return await Promise.all([...deleted, ...added]);
  }

  /**
   * Defines a message upon the start of the conversation (Get Started Screen)
   *
   * @param text - the message to be sent (mainly a greeting message)
   *
   * @returns A promise resolving to the messenger's response, otherwise an error
   */
  async _setGreetingText(
    text: string | Messenger.GreetingText[],
  ): Promise<any> {
    const greeting: Messenger.GreetingText[] =
      typeof text !== 'string'
        ? text
        : [
            {
              locale: 'default',
              text,
            },
          ];
    this.logger.debug(
      'Messenger Channel Handler : Setting greeting text ...',
      text,
    );
    return await this.api.profile.setMessengerProfile({
      greeting,
    });
  }

  /**
   * Creates the get started messenger button
   *
   * @returns A Promise that  resolves to the messenger's response, otherwise an error
   */
  async _setGetStartedButton(): Promise<any> {
    //TODO: need to check if this method needs an action param
    return await this.api.profile.setMessengerProfile({
      get_started: {
        payload: 'GET_STARTED',
      },
    });
  }

  /**
   * Deletes the get started messenger button
   *
   * @returns A promise that resolves to the messenger's response, otherwise an error
   */
  async _deleteGetStartedButton(): Promise<any> {
    return await this.api.profile.deleteMessengerProfile(['get_started']);
  }

  /**
   * Utility Function to Remove Specified Attributes
   *
   * @param tree the menu tree
   *
   * @returns A menu tree structure compliant with what Graph API expects
   */
  private formatMenu(tree: MenuTree) {
    return tree.map(
      ({
        id: _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        call_to_actions,
        ...rest
      }) => ({
        ...rest,
        // Recursively process nested call_to_actions if they exist
        call_to_actions: call_to_actions
          ? this.formatMenu(call_to_actions)
          : undefined,
      }),
    );
  }

  /**
   * Creates or updates the persistent menu, might disable or enable end user input as well
   *
   * @param composer_input_disabled - Either or not to disable the input on messenger
   *
   * @returns A promise that resolves to the messenger's response, otherwise an error
   */
  async _setPersistentMenu(composer_input_disabled?: boolean) {
    const handler: MessengerHandler = this;
    // @TODO : Deal with multi-locale persistent menu
    try {
      const menuTree = await this.menuService.getTree();
      const menu = this.formatMenu(menuTree);
      if (menu.length === 0) {
        return await handler._deletePersistentMenu();
      } else {
        const settings = await this.getSettings();
        // Update the menu
        composer_input_disabled =
          typeof composer_input_disabled !== 'undefined'
            ? composer_input_disabled
            : settings.composer_input_disabled || false;
        return await handler.api.profile.setMessengerProfile({
          persistent_menu: [
            {
              locale: 'default', // If it's not an array of locales, we'll assume is an array of buttons.
              composer_input_disabled: !!composer_input_disabled,
              call_to_actions: menu,
            },
          ],
        });
      }
    } catch (err) {
      this.logger.error(
        'Messenger Channel Handler : Unable to update menu ...',
        err,
      );
    }
  }

  /**
   * Deletes the persistent menu from messenger
   *
   * @returns A promise that resolves to the messenger's response, otherwise an error
   */
  async _deletePersistentMenu(): Promise<any> {
    return await this.api.profile.deleteMessengerProfile(['persistent_menu']);
  }
}
