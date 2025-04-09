/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module '@nestjs/event-emitter' {
  import { ModuleMetadata, Type } from '@nestjs/common';

  export interface EventEmitterModuleOptions {
    // Add any specific options here
  }

  export interface EventEmitterOptionsFactory {
    createEventEmitterOptions(): Promise<EventEmitterModuleOptions> | EventEmitterModuleOptions;
  }

  export interface EventEmitterModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<EventEmitterOptionsFactory>;
    useClass?: Type<EventEmitterOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<EventEmitterModuleOptions> | EventEmitterModuleOptions;
    inject?: any[];
  }

  export class EventEmitter2 {
    emit(event: string | symbol, ...values: any[]): boolean;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol): this;
    listeners(event: string | symbol): Function[];
    waitFor(
      event: string | symbol,
      options?: { timeout?: number; handleError?: boolean },
    ): Promise<any[]>;
  }

  export function OnEvent(event: string | symbol, options?: { async?: boolean }): MethodDecorator;

  export class EventEmitterModule {
    static forRoot(options?: EventEmitterModuleOptions): import('@nestjs/common').DynamicModule;
    static forRootAsync(
      options: EventEmitterModuleAsyncOptions,
    ): import('@nestjs/common').DynamicModule;
  }
}
