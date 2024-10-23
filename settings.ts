/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ChannelSetting } from '@/channel/types';
import { SettingType } from '@/setting/schemas/types';

import { Messenger } from './types';

export const MESSENGER_CHANNEL_NAME = 'messenger';

export const MESSENGER_GROUP_NAME = 'messenger';

export const DEFAULT_MESSENGER_SETTINGS = [
  {
    group: MESSENGER_GROUP_NAME,
    label: Messenger.SettingLabel.app_secret,
    value: '',
    type: SettingType.secret,
  },
  {
    group: MESSENGER_GROUP_NAME,
    label: Messenger.SettingLabel.access_token,
    value: '',
    type: SettingType.secret,
  },
  {
    group: MESSENGER_GROUP_NAME,
    label: Messenger.SettingLabel.verify_token,
    value: '',
    type: SettingType.secret,
  },
  {
    group: MESSENGER_GROUP_NAME,
    label: Messenger.SettingLabel.get_started_button,
    value: false,
    type: SettingType.checkbox,
  },
  {
    group: MESSENGER_GROUP_NAME,
    label: Messenger.SettingLabel.composer_input_disabled,
    value: false,
    type: SettingType.checkbox,
  },
  {
    group: MESSENGER_GROUP_NAME,
    label: Messenger.SettingLabel.greeting_text,
    value: 'Welcome! Ready to start a conversation with our chatbot?',
    type: SettingType.textarea,
  },
  {
    group: MESSENGER_GROUP_NAME,
    label: Messenger.SettingLabel.user_fields,
    value: 'first_name,last_name,profile_pic,locale,timezone,gender',
    type: SettingType.text,
  },
] as const satisfies ChannelSetting<typeof MESSENGER_CHANNEL_NAME>[];
