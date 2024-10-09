/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { SettingCreateDto } from '@/setting/dto/setting.dto';
import { SettingType } from '@/setting/schemas/types';

import { Messenger } from './types';

export const MESSENGER_CHANNEL_NAME = 'messenger';

export const DEFAULT_MESSENGER_SETTINGS: SettingCreateDto[] = [
  {
    group: MESSENGER_CHANNEL_NAME,
    label: Messenger.SettingLabel.app_secret,
    value: '',
    type: SettingType.secret,
    weight: 1,
  },
  {
    group: MESSENGER_CHANNEL_NAME,
    label: Messenger.SettingLabel.access_token,
    value: '',
    type: SettingType.secret,
    weight: 2,
  },
  {
    group: MESSENGER_CHANNEL_NAME,
    label: Messenger.SettingLabel.verify_token,
    value: '',
    type: SettingType.secret,
    weight: 3,
  },
  {
    group: MESSENGER_CHANNEL_NAME,
    label: Messenger.SettingLabel.get_started_button,
    value: false,
    type: SettingType.checkbox,
    weight: 4,
  },
  {
    group: MESSENGER_CHANNEL_NAME,
    label: Messenger.SettingLabel.composer_input_disabled,
    value: false,
    type: SettingType.checkbox,
    weight: 5,
  },
  {
    group: MESSENGER_CHANNEL_NAME,
    label: Messenger.SettingLabel.greeting_text,
    value: 'Welcome! Ready to start a conversation with our chatbot?',
    type: SettingType.textarea,
    weight: 6,
  },
  {
    group: MESSENGER_CHANNEL_NAME,
    label: Messenger.SettingLabel.user_fields,
    value: 'first_name,last_name,profile_pic,locale,timezone,gender',
    type: SettingType.text,
    weight: 7,
  },
];
