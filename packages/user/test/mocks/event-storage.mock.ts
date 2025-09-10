/**
 * @fileoverview 事件存储模拟对象
 * @description 提供事件存储的测试模拟实现
 * @since 1.0.0
 */

import { IEventStorage } from '../../src/infrastructure/event-storage/event-storage.interface';
import { IDomainEvent } from '../../src/domain/events/domain-event.interface';

/**
 * 事件存储模拟实现
 */
export class MockEventStorage implements IEventStorage {
  private events: Map<string, IDomainEvent[]> = new Map();
  private snapshots: Map<string, any> = new Map();

  async saveEvents(
    aggregateId: string,
    events: IDomainEvent[],
    expectedVersion: number,
  ): Promise<void> {
    const existingEvents = this.events.get(aggregateId) || [];
    const currentVersion = existingEvents.length;

    if (currentVersion !== expectedVersion) {
      throw new Error(
        `Version mismatch for aggregate ${aggregateId}. Expected: ${expectedVersion}, Current: ${currentVersion}`,
      );
    }

    this.events.set(aggregateId, [...existingEvents, ...events]);
  }

  async getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number,
  ): Promise<IDomainEvent[]> {
    const events = this.events.get(aggregateId) || [];

    if (fromVersion === undefined && toVersion === undefined) {
      return events;
    }

    return events.slice(
      fromVersion || 0,
      toVersion !== undefined ? toVersion + 1 : undefined,
    );
  }

  async getEventsByType(
    eventType: string,
    limit?: number,
    offset?: number,
  ): Promise<IDomainEvent[]> {
    const allEvents: IDomainEvent[] = [];

    for (const events of this.events.values()) {
      allEvents.push(...events.filter(event => event.eventType === eventType));
    }

    const start = offset || 0;
    const end = limit ? start + limit : undefined;

    return allEvents.slice(start, end);
  }

  async getEventsByDateRange(
    startDate: Date,
    endDate: Date,
    limit?: number,
    offset?: number,
  ): Promise<IDomainEvent[]> {
    const allEvents: IDomainEvent[] = [];

    for (const events of this.events.values()) {
      allEvents.push(
        ...events.filter(
          event => event.occurredOn >= startDate && event.occurredOn <= endDate,
        ),
      );
    }

    const start = offset || 0;
    const end = limit ? start + limit : undefined;

    return allEvents.slice(start, end);
  }

  async createSnapshot(
    aggregateId: string,
    aggregateState: any,
    version: number,
  ): Promise<void> {
    this.snapshots.set(`${aggregateId}-${version}`, aggregateState);
  }

  async getLatestSnapshot(aggregateId: string): Promise<any | null> {
    const snapshotKeys = Array.from(this.snapshots.keys())
      .filter(key => key.startsWith(aggregateId))
      .sort((a, b) => {
        const versionA = parseInt(a.split('-').pop() || '0');
        const versionB = parseInt(b.split('-').pop() || '0');
        return versionB - versionA;
      });

    if (snapshotKeys.length === 0) {
      return null;
    }

    return this.snapshots.get(snapshotKeys[0]) || null;
  }

  async deleteEvents(aggregateId: string): Promise<number> {
    const events = this.events.get(aggregateId) || [];
    const count = events.length;
    this.events.delete(aggregateId);
    return count;
  }

  async getEventStatistics() {
    const totalEvents = Array.from(this.events.values()).reduce(
      (sum, events) => sum + events.length,
      0,
    );

    const uniqueAggregates = this.events.size;

    const eventTypes = new Set<string>();
    for (const events of this.events.values()) {
      events.forEach(event => eventTypes.add(event.eventType));
    }

    return {
      totalEvents,
      uniqueAggregates,
      eventTypes: eventTypes.size,
      tenantId: 'test-tenant',
    };
  }

  // 测试辅助方法
  clear(): void {
    this.events.clear();
    this.snapshots.clear();
  }

  getEventCount(aggregateId: string): number {
    return this.events.get(aggregateId)?.length || 0;
  }

  getTotalEventCount(): number {
    return Array.from(this.events.values()).reduce(
      (sum, events) => sum + events.length,
      0,
    );
  }

  hasEvents(aggregateId: string): boolean {
    return (
      this.events.has(aggregateId) && this.events.get(aggregateId)!.length > 0
    );
  }

  getSnapshotCount(): number {
    return this.snapshots.size;
  }
}
