import { supabase } from './supabase';

type NotificationType = 
    | 'ngo_request' 
    | 'delivery_update' 
    | 'system_alert' 
    | 'verification_status' 
    | 'general';

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedEntityType?: 'donation' | 'delivery' | 'request' | 'profile' | 'system';
    relatedEntityId?: string;
    createdBy?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    actionUrl?: string;
}

export async function createNotification(params: CreateNotificationParams) {
    try {
        const { error } = await supabase.from('notifications').insert({
            user_id: params.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            related_entity_type: params.relatedEntityType || 'general',
            related_entity_id: params.relatedEntityId,
            created_by: params.createdBy,
            priority: params.priority || 'low',
            action_url: params.actionUrl,
            is_read: false
        });
        if (error) console.error("Error creating notification:", error);
    } catch (err) {
        console.error("Error creating notification exception:", err);
    }
}

interface AuditLogParams {
    entityName: 'donations' | 'food_requests' | 'deliveries' | 'profiles';
    entityId: string;
    action: 'created' | 'updated' | 'deleted' | 'status_changed';
    performedBy?: string;
    changes?: any;
}

export async function createAuditLog(params: AuditLogParams) {
    try {
        let performedBy = params.performedBy;
        if (performedBy === 'system') {
            performedBy = null;
        }
        const { error } = await supabase.from('audit_logs').insert({
            entity_name: params.entityName,
            entity_id: params.entityId,
            action: params.action,
            performed_by: performedBy,
            changes: params.changes || {}
        });
        if (error) console.error("Error creating audit log:", error);
    } catch (err) {
        console.error("Error creating audit log exception:", err);
    }
}
