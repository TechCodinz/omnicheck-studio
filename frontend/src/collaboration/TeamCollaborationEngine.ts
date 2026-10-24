import io from 'socket.io-client';
import { API_URL } from '../config';

export interface TeamMember {
    id: string;
    name: string;
    role: 'owner' | 'approver' | 'editor' | 'viewer';
    cursorPos?: { x: number; y: number };
}

export interface CollaborationSession {
    id: string;
    checkId: string;
    startTime: string;
    members: TeamMember[];
    activityLogs: any[];
    permissions: PermissionMatrix;
}

export interface PermissionMatrix {
    owner: RolePermissions;
    approver: RolePermissions;
    editor: RolePermissions;
    viewer: RolePermissions;
}

export interface RolePermissions {
    canEdit: boolean;
    canApprove: boolean;
    canDelete: boolean;
    canExport: boolean;
    canInvite: boolean;
    canManageTeam: boolean;
}

export class TeamCollaborationEngine {
    private socket: any = null;
    private currentSession: CollaborationSession | null = null;
    private eventHandlers: Map<string, Function[]> = new Map();

    async startCollaborativeSession(checkId: string, user: TeamMember): Promise<CollaborationSession> {
        this.socket = io(API_URL, { auth: { token: localStorage.getItem('token') || '' } });

        this.socket.on('connect', () => {
            console.log('Connected to collaboration server');
            this.socket?.emit('join-room', checkId);
        });

        this.socket.on('field-updated', (data: { roomId: string; fieldId: string; value: any; userId: string }) => {
            this.triggerEvent('fieldUpdate', data);
        });

        this.socket.on('cursor-moved', (data: { userId: string; x: number; y: number; userName: string }) => {
            this.triggerEvent('cursorMove', data);
        });

        this.currentSession = {
            id: `session_${Date.now()}`,
            checkId,
            startTime: new Date().toISOString(),
            members: [user],
            activityLogs: [],
            permissions: this.setupPermissions()
        };

        return this.currentSession;
    }

    sendFieldUpdate(checkId: string, fieldId: string, value: any) {
        this.socket?.emit('field-update', { roomId: checkId, fieldId, value });
    }

    sendCursorMove(checkId: string, x: number, y: number, userName: string) {
        this.socket?.emit('cursor-move', { roomId: checkId, x, y, userName });
    }

    on(event: 'fieldUpdate' | 'cursorMove', handler: Function) {
        if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, []);
        this.eventHandlers.get(event)?.push(handler);
    }

    private triggerEvent(event: string, data: any) {
        this.eventHandlers.get(event)?.forEach(h => h(data));
    }

    private setupPermissions(): PermissionMatrix {
        return {
            owner: {
                canEdit: true,
                canApprove: true,
                canDelete: true,
                canExport: true,
                canInvite: true,
                canManageTeam: true
            },
            approver: {
                canEdit: true,
                canApprove: true,
                canDelete: false,
                canExport: true,
                canInvite: false,
                canManageTeam: false
            },
            editor: {
                canEdit: true,
                canApprove: false,
                canDelete: false,
                canExport: true,
                canInvite: false,
                canManageTeam: false
            },
            viewer: {
                canEdit: false,
                canApprove: false,
                canDelete: false,
                canExport: false,
                canInvite: false,
                canManageTeam: false
            }
        };
    }

    async disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }
}
