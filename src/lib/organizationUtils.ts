import { fallbackOrganization, type OrganizationProfile } from '@/lib/authUtils';

type SupabaseClientLike = {
  from: (table: string) => any;
};

type ResolveUserOrganizationParams = {
  userId?: string | null;
  userEmail?: string | null;
  preferredOrgId?: string | null;
  allowMembershipFallback?: boolean;
};

export interface UserOrganizationIdentity {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: 'owner' | 'admin' | 'teacher' | 'member' | 'parent' | 'student';
  source: 'created' | 'identity' | 'membership' | 'employee';
  isPrimary: boolean;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  roleConfig?: Record<string, any>;
}

const MEMBERSHIP_SELECT =
  'org_id, is_primary, created_at, hanami_organizations ( id, org_name, org_slug, status )';

const mapOrganizationRecord = (record: any): OrganizationProfile | null => {
  if (!record) return null;
  return {
    id: record.id,
    name: record.org_name,
    slug: record.org_slug,
    status: record.status ?? null,
  };
};

const fetchMembership = async (
  client: SupabaseClientLike,
  field: 'user_id' | 'user_email',
  value: string,
) => {
  try {
    const { data, error } = await client
      .from('hanami_user_organizations')
      .select(MEMBERSHIP_SELECT)
      .eq(field, value)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('resolveUserOrganization: membership lookup failed', { field, error });
      return null;
    }

    return data;
  } catch (err) {
    console.error('resolveUserOrganization: membership lookup error', { field, err });
    return null;
  }
};

const fetchOrganizationById = async (client: SupabaseClientLike, orgId: string) => {
  if (!orgId) return null;

  try {
    const { data, error } = await client
      .from('hanami_organizations')
      .select('id, org_name, org_slug, status')
      .eq('id', orgId)
      .maybeSingle();

    if (error) {
      console.error('resolveUserOrganization: organization lookup failed', { orgId, error });
      return null;
    }

    return mapOrganizationRecord(data);
  } catch (err) {
    console.error('resolveUserOrganization: organization lookup error', { orgId, err });
    return null;
  }
};

export async function resolveUserOrganization(
  client: SupabaseClientLike,
  params: ResolveUserOrganizationParams = {},
): Promise<OrganizationProfile> {
  const fallbackOrg = fallbackOrganization;

  if (!client) {
    return fallbackOrg;
  }

  const {
    userId,
    userEmail,
    preferredOrgId,
    allowMembershipFallback = true,
  } = params;

  let resolvedOrg: OrganizationProfile | null = null;
  let candidateOrgId: string | null =
    preferredOrgId && preferredOrgId !== 'default-org' ? preferredOrgId : null;

  if (!candidateOrgId && allowMembershipFallback && userId) {
    const membership = await fetchMembership(client, 'user_id', userId);
    if (membership?.org_id) {
      candidateOrgId = membership.org_id;
      resolvedOrg = mapOrganizationRecord(membership.hanami_organizations);
    }
  }

  if (!candidateOrgId && allowMembershipFallback && userEmail) {
    const membership = await fetchMembership(client, 'user_email', userEmail);
    if (membership?.org_id) {
      candidateOrgId = membership.org_id;
      resolvedOrg = mapOrganizationRecord(membership.hanami_organizations);
    }
  }

  if (candidateOrgId && !resolvedOrg) {
    resolvedOrg = await fetchOrganizationById(client, candidateOrgId);
  }

  if (resolvedOrg) {
    return resolvedOrg;
  }

  if (preferredOrgId && preferredOrgId !== 'default-org') {
    const fallbackResolved = await fetchOrganizationById(client, preferredOrgId);
    if (fallbackResolved) {
      return fallbackResolved;
    }
  }

  return fallbackOrg;
}

/**
 * 獲取用戶創建的機構
 */
async function getUserCreatedOrganizations(
  client: SupabaseClientLike,
  userId?: string | null,
  userEmail?: string | null,
): Promise<UserOrganizationIdentity[]> {
  const identities: UserOrganizationIdentity[] = [];

  if (!client) return identities;

  try {
    console.log('getUserCreatedOrganizations: 開始查詢', { userId, userEmail });

    // 先嘗試通過 userId 查詢（如果提供）
    if (userId) {
      const { data: orgs, error } = await client
        .from('hanami_organizations')
        .select('id, org_name, org_slug, status, created_by')
        .eq('created_by', userId);

      if (error) {
        console.error('getUserCreatedOrganizations: userId 查詢錯誤', error);
      } else {
        console.log('getUserCreatedOrganizations: userId 查詢結果', { count: orgs?.length || 0, orgs });
        if (orgs && Array.isArray(orgs)) {
          for (const org of orgs) {
            identities.push({
              orgId: org.id,
              orgName: org.org_name,
              orgSlug: org.org_slug,
              role: 'owner',
              source: 'created',
              isPrimary: false,
              status: org.status || 'active',
            });
          }
        }
      }
    }

    // 如果通過 userId 沒有找到，且提供了 userEmail，嘗試通過 email 查詢
    // 注意：這需要檢查是否有其他表可以關聯 email 和 created_by
    // 但由於 created_by 是 UUID，無法直接通過 email 查詢
    // 所以我們依賴其他函數（如 getUserIdentityOrganizations）來通過 email 查找

  } catch (err) {
    console.error('getUserCreatedOrganizations: 異常', err);
  }

  console.log('getUserCreatedOrganizations: 返回結果', { count: identities.length });
  return identities;
}

/**
 * 獲取用戶在 hanami_org_identities 表中的身份
 */
async function getUserIdentityOrganizations(
  client: SupabaseClientLike,
  userId?: string | null,
  userEmail?: string | null,
): Promise<UserOrganizationIdentity[]> {
  const identities: UserOrganizationIdentity[] = [];

  if (!client) return identities;

  try {
    console.log('getUserIdentityOrganizations: 開始查詢', { userId, userEmail });

    const query = client
      .from('hanami_org_identities')
      .select(
        'org_id, role_type, status, is_primary, role_config, hanami_organizations ( id, org_name, org_slug, status )',
      )
      .eq('status', 'active');

    if (userId) {
      query.eq('user_id', userId);
    } else if (userEmail) {
      query.eq('user_email', userEmail);
    } else {
      console.log('getUserIdentityOrganizations: 沒有 userId 或 userEmail，跳過查詢');
      return identities;
    }

    const { data: identityRecords, error } = await query;

    if (error) {
      console.error('getUserIdentityOrganizations: 查詢錯誤', error);
      return identities;
    }

    console.log('getUserIdentityOrganizations: 查詢結果', { count: identityRecords?.length || 0, identityRecords });

    if (identityRecords && Array.isArray(identityRecords)) {
      for (const record of identityRecords) {
        const org = record.hanami_organizations;
        if (org) {
          identities.push({
            orgId: org.id,
            orgName: org.org_name,
            orgSlug: org.org_slug,
            role: record.role_type as UserOrganizationIdentity['role'],
            source: 'identity',
            isPrimary: record.is_primary || false,
            status: record.status || 'active',
            roleConfig: record.role_config || {},
          });
        } else {
          console.warn('getUserIdentityOrganizations: 記錄缺少機構信息', record);
        }
      }
    }
  } catch (err) {
    console.error('getUserIdentityOrganizations: 異常', err);
  }

  console.log('getUserIdentityOrganizations: 返回結果', { count: identities.length });
  return identities;
}

/**
 * 獲取用戶作為成員的機構（從 hanami_user_organizations）
 */
async function getUserMemberOrganizations(
  client: SupabaseClientLike,
  userId?: string | null,
  userEmail?: string | null,
): Promise<UserOrganizationIdentity[]> {
  const identities: UserOrganizationIdentity[] = [];

  if (!client) return identities;

  try {
    console.log('getUserMemberOrganizations: 開始查詢', { userId, userEmail });

    const query = client
      .from('hanami_user_organizations')
      .select(
        'org_id, role, is_primary, hanami_organizations ( id, org_name, org_slug, status )',
      );

    if (userId) {
      query.eq('user_id', userId);
    } else if (userEmail) {
      query.eq('user_email', userEmail);
    } else {
      console.log('getUserMemberOrganizations: 沒有 userId 或 userEmail，跳過查詢');
      return identities;
    }

    const { data: memberships, error } = await query;

    if (error) {
      console.error('getUserMemberOrganizations: 查詢錯誤', error);
      return identities;
    }

    console.log('getUserMemberOrganizations: 查詢結果', { count: memberships?.length || 0, memberships });

    if (memberships && Array.isArray(memberships)) {
      for (const membership of memberships) {
        const org = membership.hanami_organizations;
        if (org) {
          identities.push({
            orgId: org.id,
            orgName: org.org_name,
            orgSlug: org.org_slug,
            role: (membership.role || 'member') as UserOrganizationIdentity['role'],
            source: 'membership',
            isPrimary: membership.is_primary || false,
            status: org.status || 'active',
          });
        } else {
          console.warn('getUserMemberOrganizations: 成員記錄缺少機構信息', membership);
        }
      }
    }
  } catch (err) {
    console.error('getUserMemberOrganizations: 異常', err);
  }

  console.log('getUserMemberOrganizations: 返回結果', { count: identities.length });
  return identities;
}

/**
 * 獲取用戶作為員工的機構（從 hanami_employee）
 */
async function getUserEmployeeOrganizations(
  client: SupabaseClientLike,
  userEmail?: string | null,
): Promise<UserOrganizationIdentity[]> {
  const identities: UserOrganizationIdentity[] = [];

  if (!client || !userEmail) {
    console.log('getUserEmployeeOrganizations: 缺少 client 或 userEmail', { hasClient: !!client, userEmail });
    return identities;
  }

  try {
    console.log('getUserEmployeeOrganizations: 開始查詢', { userEmail });

    const { data: employees, error } = await client
      .from('hanami_employee')
      .select('org_id, teacher_status, hanami_organizations ( id, org_name, org_slug, status )')
      .eq('teacher_email', userEmail);

    if (error) {
      console.error('getUserEmployeeOrganizations: 查詢錯誤', error);
      return identities;
    }

    console.log('getUserEmployeeOrganizations: 查詢結果', { count: employees?.length || 0, employees });

    if (employees && Array.isArray(employees)) {
      for (const employee of employees) {
        const org = employee.hanami_organizations;
        if (org && employee.org_id) {
          const isActive =
            employee.teacher_status &&
            ['active', 'full time', 'part time', 'contract'].includes(employee.teacher_status);

          identities.push({
            orgId: org.id,
            orgName: org.org_name,
            orgSlug: org.org_slug,
            role: 'teacher',
            source: 'employee',
            isPrimary: false,
            status: isActive ? 'active' : 'inactive',
          });
        } else {
          console.warn('getUserEmployeeOrganizations: 員工記錄缺少機構信息', employee);
        }
      }
    }
  } catch (err) {
    console.error('getUserEmployeeOrganizations: 異常', err);
  }

  console.log('getUserEmployeeOrganizations: 返回結果', { count: identities.length });
  return identities;
}

/**
 * 獲取用戶所有機構身份
 * 包括：創建的機構、身份表中的身份、成員身份、員工身份
 */
export async function getUserOrganizations(
  client: SupabaseClientLike,
  userId?: string | null,
  userEmail?: string | null,
): Promise<UserOrganizationIdentity[]> {
  if (!client) {
    console.warn('getUserOrganizations: client is null');
    return [];
  }

  console.log('getUserOrganizations: 開始查詢', { userId, userEmail });

  const allIdentities: UserOrganizationIdentity[] = [];

  // 1. 2. 3. 4. 平行執行所有查詢以提高速度
  console.log('getUserOrganizations: 開始平行查詢所有機構身份...');

  const [createdOrgs, identityOrgs, memberOrgs, employeeOrgs] = await Promise.all([
    // 1. 獲取創建的機構
    getUserCreatedOrganizations(client, userId, userEmail)
      .then(res => {
        console.log('getUserOrganizations: 創建的機構查詢完成', res.length);
        return res;
      }),

    // 2. 獲取身份表中的身份
    getUserIdentityOrganizations(client, userId, userEmail)
      .then(res => {
        console.log('getUserOrganizations: 身份表查詢完成', res.length);
        return res;
      }),

    // 3. 獲取成員身份
    getUserMemberOrganizations(client, userId, userEmail)
      .then(res => {
        console.log('getUserOrganizations: 成員身份查詢完成', res.length);
        return res;
      }),

    // 4. 獲取員工身份
    getUserEmployeeOrganizations(client, userEmail)
      .then(res => {
        console.log('getUserOrganizations: 員工身份查詢完成', res.length);
        return res;
      })
  ]);

  console.log('getUserOrganizations: 所有查詢完成，開始合併結果');

  allIdentities.push(...createdOrgs);
  allIdentities.push(...identityOrgs);
  allIdentities.push(...memberOrgs);
  allIdentities.push(...employeeOrgs);

  // 去重：如果同一個機構有多個身份，保留優先級最高的
  const orgMap = new Map<string, UserOrganizationIdentity>();

  for (const identity of allIdentities) {
    // 過濾掉 inactive 的機構
    if (identity.status === 'inactive') {
      console.log(`getUserOrganizations: 過濾掉 inactive 機構 ${identity.orgName} (${identity.orgId})`);
      continue;
    }

    const existing = orgMap.get(identity.orgId);

    if (!existing) {
      orgMap.set(identity.orgId, identity);
    } else {
      // 優先級：created > identity > membership > employee
      // 角色優先級：owner > admin > teacher > member
      const sourcePriority = {
        created: 4,
        identity: 3,
        membership: 2,
        employee: 1,
      };
      const rolePriority = {
        owner: 4,
        admin: 3,
        teacher: 2,
        member: 1,
        parent: 1,
        student: 1,
      };

      const currentSourcePriority = sourcePriority[identity.source] || 0;
      const existingSourcePriority = sourcePriority[existing.source] || 0;
      const currentRolePriority = rolePriority[identity.role] || 0;
      const existingRolePriority = rolePriority[existing.role] || 0;

      if (
        currentSourcePriority > existingSourcePriority ||
        (currentSourcePriority === existingSourcePriority && currentRolePriority > existingRolePriority)
      ) {
        orgMap.set(identity.orgId, identity);
      } else if (identity.isPrimary && !existing.isPrimary) {
        orgMap.set(identity.orgId, identity);
      }
    }
  }

  // 按優先級排序
  const sortedIdentities = Array.from(orgMap.values()).sort((a, b) => {
    const sourcePriority = {
      created: 4,
      identity: 3,
      membership: 2,
      employee: 1,
    };
    const rolePriority = {
      owner: 4,
      admin: 3,
      teacher: 2,
      member: 1,
      parent: 1,
      student: 1,
    };

    const aSourcePriority = sourcePriority[a.source] || 0;
    const bSourcePriority = sourcePriority[b.source] || 0;
    const aRolePriority = rolePriority[a.role] || 0;
    const bRolePriority = rolePriority[b.role] || 0;

    if (aSourcePriority !== bSourcePriority) {
      return bSourcePriority - aSourcePriority;
    }
    if (aRolePriority !== bRolePriority) {
      return bRolePriority - aRolePriority;
    }
    if (a.isPrimary !== b.isPrimary) {
      return a.isPrimary ? -1 : 1;
    }
    return 0;
  });

  return sortedIdentities;
}

