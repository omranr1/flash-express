import { Injectable, MessageEvent } from '@nestjs/common'
import { Observable, Subject } from 'rxjs'

@Injectable()
export class OrderEventsService {
  private readonly streams = new Map<string, Set<Subject<MessageEvent>>>()

  subscribe(userId: string): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>()
    const active = this.streams.get(userId) || new Set<Subject<MessageEvent>>()
    active.add(subject)
    this.streams.set(userId, active)
    return new Observable((subscriber) => {
      const subscription = subject.subscribe(subscriber)
      return () => { subscription.unsubscribe(); active.delete(subject); if (active.size === 0) this.streams.delete(userId) }
    })
  }

  emit(userId: string, data: object) { this.streams.get(userId)?.forEach((stream) => stream.next({ data })) }
}
