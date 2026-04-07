import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr';

let globalHub: HubConnection | null = null;

export function createGlobalHub(token: string): HubConnection {
  if (globalHub) return globalHub;
  
  globalHub = new HubConnectionBuilder()
    .withUrl('/hubs/global', { accessTokenFactory: () => token })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  return globalHub;
}

export function getGlobalHub(): HubConnection | null {
  return globalHub;
}

export async function disposeGlobalHub(): Promise<void> {
  if (globalHub) {
    await globalHub.stop();
    globalHub = null;
  }
}

export type { HubConnection };
