// services/websocketService.ts
import { Client, StompSubscription, IMessage } from '@stomp/stompjs';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export interface NotificationMessage {
    type: 'NEW_MESSAGE' | 'MESSAGE_READ' | 'CONVERSATION_DELETED';
    conversationId?: string;
    userConversationId?: string;
    senderId?: string;
    senderName?: string;
    content?: string;
    preview?: string;
    receiverId?: string;
    unreadCount?: number;
    timestamp: number;
}

export type NotificationHandler = (notification: NotificationMessage) => void;

class WebSocketService {
    private client: Client | null = null;
    private subscriptions: Map<string, StompSubscription> = new Map();
    private handlers: Map<string, NotificationHandler[]> = new Map();
    private isConnected = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private userId: string | null = null;

    /**
     * Conecta al WebSocket
     */
    async connect(userId: string, onConnected?: () => void): Promise<void> {
        this.userId = userId;

        if (typeof globalThis !== 'undefined' && !(globalThis as typeof globalThis & { global?: typeof globalThis }).global) {
            (globalThis as typeof globalThis & { global?: typeof globalThis }).global = globalThis;
        }

        const { default: SockJS } = await import('sockjs-client');
        
        return new Promise((resolve, reject) => {
            this.client = new Client({
                webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
                debug: (str) => {
                    if (process.env.NODE_ENV === 'development') {
                        console.debug(str);
                    }
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            this.client.onConnect = () => {
                console.log('WebSocket conectado');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Suscribirse a notificaciones personales
                const subscription = this.client!.subscribe(
                    `/user/queue/notifications`,
                    (message: IMessage) => {
                        try {
                            const notification: NotificationMessage = JSON.parse(message.body);
                            this.handleNotification(notification);
                        } catch (error) {
                            console.error('Error parsing notification:', error);
                        }
                    }
                );
                
                this.subscriptions.set('notifications', subscription);
                onConnected?.();
                resolve();
            };

            this.client.onStompError = (frame) => {
                console.error('STOMP error:', frame);
                reject(new Error(frame.headers['message']));
            };

            this.client.onWebSocketError = (event) => {
                console.error('WebSocket error:', event);
                this.handleDisconnect();
            };

            this.client.onDisconnect = () => {
                this.handleDisconnect();
            };

            this.client.activate();
        });
    }

    /**
     * Maneja la desconexión
     */
    private handleDisconnect() {
        console.log('WebSocket desconectado');
        this.isConnected = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Reconectando... intento ${this.reconnectAttempts}`);
                this.connect(this.userId!);
            }, 5000 * this.reconnectAttempts);
        }
    }

    /**
     * Registra un handler para un tipo de notificación
     */
    on(eventType: string, handler: NotificationHandler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType)!.push(handler);
    }

    /**
     * Elimina un handler
     */
    off(eventType: string, handler: NotificationHandler) {
        if (this.handlers.has(eventType)) {
            const handlers = this.handlers.get(eventType)!;
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Procesa una notificación entrante
     */
    private handleNotification(notification: NotificationMessage) {
        console.log('Notificación recibida:', notification);
        
        // Ejecutar handlers específicos por tipo
        const handlers = this.handlers.get(notification.type);
        if (handlers) {
            handlers.forEach(handler => handler(notification));
        }
        
        // Ejecutar handlers genéricos
        const genericHandlers = this.handlers.get('*');
        if (genericHandlers) {
            genericHandlers.forEach(handler => handler(notification));
        }
        
        // Mostrar notificación push si la página no está activa
        if (document.hidden && notification.type === 'NEW_MESSAGE') {
            this.showPushNotification(notification);
        }
    }

    /**
     * Solicita permiso para notificaciones push
     */
    async requestPushPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('Este navegador no soporta notificaciones');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        
        return false;
    }

    /**
     * Muestra notificación push nativa
     */
    private showPushNotification(notification: NotificationMessage) {
        if (Notification.permission !== 'granted') return;
        
        const title = notification.senderName || 'Nuevo mensaje';
        const body = notification.preview || notification.content || '';
        
        const notif = new Notification(title, {
            body: body,
            icon: '/assets/huellas.svg',
            tag: `msg-${notification.conversationId}`,
            silent: false,
        });
        
        notif.onclick = () => {
            window.focus();
            if (notification.userConversationId) {
                window.location.href = `/conversations/${notification.userConversationId}`;
            } else if (notification.conversationId) {
                window.location.href = `/conversations`;
            }
            notif.close();
        };
        
        // Auto-cierre después de 10 segundos
        setTimeout(() => notif.close(), 10000);
    }

    /**
     * Desconecta el WebSocket
     */
    disconnect() {
        if (this.client && this.client.connected) {
            this.subscriptions.forEach(sub => sub.unsubscribe());
            this.subscriptions.clear();
            this.client.deactivate();
        }
        this.client = null;
        this.isConnected = false;
    }

    /**
     * Verifica si está conectado
     */
    isConnectedToWebSocket(): boolean {
        return this.isConnected && this.client?.connected === true;
    }
}

export const websocketService = new WebSocketService();
export default websocketService;