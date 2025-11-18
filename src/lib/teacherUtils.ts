export interface TeacherIdentity {
  nickname?: string | null;
  fullname?: string | null;
  userFullName?: string | null;
  email?: string | null;
}

export function buildTeacherDisplayName(identity: TeacherIdentity): string {
  const email = identity.email || '';
  const baseName =
    identity.nickname ||
    identity.fullname ||
    identity.userFullName ||
    (email ? email.split('@')[0] : '');

  if (!email) {
    return baseName || '未分配';
  }

  if (baseName && baseName.toLowerCase() !== email.toLowerCase() && !baseName.includes('@')) {
    return `${baseName} (${email})`;
  }

  return email;
}

