// 聚合根
export { NotifPreferences } from './aggregates/notif-preferences.aggregate';

// 实体
export { NotifPreferencesEntity } from './entities/notif-preferences.entity';

// 值对象
export { ChannelPreference } from './value-objects/channel-preference.vo';
export { TimePreference } from './value-objects/time-preference.vo';
export { ContentPreference } from './value-objects/content-preference.vo';
export { FrequencyPreference } from './value-objects/frequency-preference.vo';

// 领域事件
export { NotifPreferencesCreatedEvent } from './events/notif-preferences-created.event';
export { NotifPreferencesUpdatedEvent } from './events/notif-preferences-updated.event';
export { ChannelPreferenceChangedEvent } from './events/channel-preference-changed.event';
export { TimePreferenceChangedEvent } from './events/time-preference-changed.event';

// 领域服务
export { NotifPreferencesService } from './services/notif-preferences.service';

// 错误类
export { InvalidNotifPreferencesError } from './entities/notif-preferences.entity';
