import { DEFAULT_MESSENGER_SETTINGS, MESSENGER_GROUP_NAME } from './settings';

declare global {
  interface Settings extends SettingTree<typeof DEFAULT_MESSENGER_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookExtensionsOperationMap {
    [MESSENGER_GROUP_NAME]: TDefinition<
      object,
      SettingMapByType<typeof DEFAULT_MESSENGER_SETTINGS>
    >;
  }
}
