import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Computes a secure SHA-256 hash of an invitation token for single-use expiring links
 */
export function hashInvitationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a high-entropy random token for caregiver invitations
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Server-side guard to check whether an actor has permission to view or manage a patient's records
 */
export async function verifyPatientOrCaregiverAccess(
  actorId: string,
  patientId: string,
  requiredPermission?: 'can_view_medicines' | 'can_edit_schedules' | 'can_receive_missed_dose_alerts'
): Promise<{ allowed: boolean; isCaregiver: boolean; reason?: string }> {
  // If the actor is the patient themselves, always grant access
  if (actorId === patientId) {
    return { allowed: true, isCaregiver: false };
  }

  const supabase = createAdminClient();

  // Query caregiver relationship table
  const { data: relationship, error } = await supabase
    .from('caregiver_relationships')
    .select('invitation_status, permissions, revoked_at')
    .eq('patient_id', patientId)
    .eq('caregiver_id', actorId)
    .eq('invitation_status', 'accepted')
    .is('revoked_at', null)
    .single();

  if (error || !relationship) {
    return { allowed: false, isCaregiver: false, reason: 'No active caregiver relationship found' };
  }

  // If specific sub-permission is required, verify flag
  if (requiredPermission) {
    const permissions = relationship.permissions as Record<string, boolean>;
    if (!permissions[requiredPermission]) {
      return { allowed: false, isCaregiver: true, reason: `Caregiver lacks ${requiredPermission} permission` };
    }
  }

  return { allowed: true, isCaregiver: true };
}

/**
 * Helper to record an audit log entry on the server
 */
export async function logAuditEvent(entry: {
  patientId?: string | null;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string;
}) {
  try {
    const supabase = createAdminClient();

    // Redact IP address to respect Indian DPDP act and minimize PII storage
    const redactedIp = entry.ipAddress ? entry.ipAddress.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.xxx.xxx') : 'redacted';

    await supabase.from('audit_logs').insert({
      patient_id: entry.patientId,
      actor_id: entry.actorId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      details: entry.details,
      ip_address_redacted: redactedIp,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
